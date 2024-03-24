import { useQuery } from 'react-query'
import { get as _get, keyBy, eq, fromPairs, mapValues } from 'lodash'
import { Link } from 'react-router-dom'
import axios from './axios'
import { sqlSelect } from './sql'
import { toFormData, parseJSON } from './utils'
import { TYPES_WITH_QUOTES } from '../consts'

export const useAuthorization = ({ token, u_hash }) => useQuery(['authorization', { token, u_hash }], async () => {
  if (!token || !u_hash) return { authorized: false }
  const response = await axios.post('/user/authorized', toFormData({ token, u_hash }))
  const user = response.data?.auth_user
  return user ? {
    authorized: true,
    ...user
  } : {
    authorized: false
  }
}, {
  staleTime: 10 * 60 * 1000
})

export const useUsers = userId => useQuery(['users'].concat(userId || []), async () => {
  if (userId === 'create') {
    return {
      id_role: '1'
    }
  }

  const response = await axios.postWithAuth('/query/select', {
    sql: `SELECT * FROM users WHERE active=1 AND deleted!=1${userId ? ` AND id_user=${userId}` : ''}`
  })
  const users = (response.data?.data || []).map(user => {
    user.json = !user.json ? {} : parseJSON(user.json)
    return user
  })
  return userId ? users[0] : users
})

export const useCountries = () => useQuery('countries', async () => {
  const response = await axios.postWithAuth('/query/select', { sql: `SELECT \`ISO 3166-1 alpha-2 code\` as value, country_name_ru as label FROM countries_list WHERE active=1 ORDER BY country_name_ru` })
  let list = _get(response, ['data', 'data']) || []
  const ru = list.find(item => item.value === 'ru')
  const by = list.find(item => item.value === 'by')
  list = list.filter(item => !['ru', 'by'].includes(item.value))
  list = [ru, by].filter(Boolean).concat(list)
  const map = keyBy(list, 'value')
  return { map, list }
}, {
  staleTime: 10 * 60 * 1000
})

export const useCities = (country) => useQuery(['cities', country], async () => {
  const response = await axios.postWithAuth('/query/select', { sql: `SELECT id_city as value, country, name_ru as label FROM city WHERE country='${country}' ORDER BY name_ru` })
  const list = _get(response, ['data', 'data']) || []
  const map = keyBy(list, 'value')
  return { map, list }
}, {
  enabled: !!country
})

/* 
useFormDescription
@return {
  selection?: {
    kod?: string,
    name: string
  },
  fields: [{
    name: string,
    label?: string
  }],
  insert?: {
    i1: string
  },
  update?: {
    u1: string
  },
  deleteQuery?: {
    d1: string
  },
  select?: [{
    select: string,
    from: string,
    where?: string,
    order?: string
  }]
}
*/

const getFormDescription = (table, name) => async () => {
  const response = await axios.postWithAuth('/query/select', {
    sql: `select v.pole as selection, s.pole as \`select\`, s.id as id_select, f.pole as \`from\`, w.pole as \`where\`, o.pole as \`order\`, i.pole as field, t.pole as \`insert\`, t.id as id_insert, u.pole as \`update\`, u.id as id_update, d.pole as \`delete\`, d.id as id_delete from ${table} m
      left join ${table} v on v.id_ref=m.id and v.tip='selection'
      left join ${table} s on s.id_ref=v.id and s.tip='select'
      left join ${table} i on i.id_ref=v.id and i.tip='field_select'
      left join ${table} f on f.id_ref=v.id and f.tip='from_select'
      left join ${table} w on w.id_ref=v.id and w.tip='where_select'
      left join ${table} o on o.id_ref=v.id and o.tip='order_select'
      left join ${table} t on t.id_ref=v.id and t.tip='insert_selection'
      left join ${table} u on u.id_ref=v.id and u.tip='update_selection'
      left join ${table} d on d.id_ref=v.id and d.tip='delete_selection'
    where m.tip='forma' and m.id=${name}`.replaceAll('\n', ' ')
  })
  const optionsPromise = []
  const data = response.data?.data || []
  const config = data.reduce((acc, item) => {
    let sqlSelect = {
      select: parseJSON(item.select)?.clause,
      from: parseJSON(item.from)?.clause,
      where: parseJSON(item.where)?.clause,
      order: parseJSON(item.order)?.order
    }
    const field = parseJSON(item.field) || {}

    let parts = []
    if (sqlSelect.select) {
      parts = sqlSelect.select.split(',').map(item => {
        const str = item.trim()
        const asPos = str.indexOf(' as ')
        if (asPos === -1) return str
        return str.substr(asPos + 4)
      })
      Object.keys(field).forEach(name => {
        if (parts.includes(name)) {
          field[name].order = parts.indexOf(name)
        }
      })
    }

    Object.keys(field).forEach((name) => {
      const f = field[name]
      if (!f.type) {
        f.with_quotes = true
      } else {
        f.with_quotes = !!TYPES_WITH_QUOTES.find(type => f.type.indexOf(type) === 0)
      }
      const props = {}
      if (f.label) {
        props.label = f.label
      }
      if (f.answer_options_type) {
        props.type = 'select'
        props.options = f.answer_options_type === 'enumeration' ?
          f.answer_options.map(item => ({ label: Object.keys(item)[0], value: Object.values(item)[0] })) :
          []
        if (f.answer_options_type === 'sql_query') {
          optionsPromise.push(fetchSelectOptions(f.answer_options)().then(options => ([name, options])))
        }
      }
      f.props = props
    })

    if (!acc.select.find(item => !eq(item, sqlSelect))) {
      acc.select.push(sqlSelect)
    }
    
    acc.selection = { ...acc.selection, ...parseJSON(item.selection) }
    acc.fields = { ...acc.fields, ...field }
    acc.insert = { ...acc.insert, ...parseJSON(item.insert) }
    acc.update = { ...acc.update, ...parseJSON(item.update) }
    acc.deleteQuery = { ...acc.delete, ...parseJSON(item.delete) }
    acc.queryId = {
      ...acc.queryId,
      insert: item.id_insert,
      select: item.id_select,
      update: item.id_update,
      delete: item.id_delete
    }
    return acc
  }, {
    queryId: {},
    selection: {},
    fields: {},
    insert: {},
    update: {},
    deleteQuery: {},
    select: []
  })
  
  const options = await Promise.all(optionsPromise)
  const optionsMap = fromPairs(options)

  config.keylabel = ''
  Object.keys(config.fields).forEach(name => {
    const field = config.fields[name]
    if (field.keylable && field.keylable.trim() === 'Y') {
      config.keylabel = name
    }
    if (optionsMap[name]) {
      let options = optionsMap[name]
      // if (!TYPES_WITH_QUOTES.includes(field.type)) {
      //   options = options.map(({ label, value }) => ({ label, value: parseInt(value) }))
      // }

      field.props = {
        ...field.props,
        options
      }
    }
  })

  config.fields = Object.keys(config.fields)
    .sort((a, b) => config.fields[a].order - config.fields[b].order)
    .map(name => ({
      name,
      ...config.fields[name]
    }))

  return config
}

export const useFormDescription = (name, table = 'metabase') => useQuery([table, name], getFormDescription(table, name), {
  staleTime: 600 * 1000
})

export const fetchSelectOptions = (asyncOptions) => async () => {
  if (!asyncOptions) return {}
  const { sql_query, view_field, write_field } = asyncOptions
  const response = await axios.postWithAuth('/query/select', { sql: sql_query })
  const data = response.data?.data || []
  return data.map(item => ({
    value: String(item[write_field]),
    label: item[view_field]
  }))
}

export const useSelectOptions = (name, asyncOptions, params) => useQuery(['select-options', name], fetchSelectOptions(asyncOptions), params)

export const useMainNav = () => useQuery('main-nav', async () => {
  const selectionId = 65
  const parentId = 'metaadm'
  const menu = await getFormDescription(parentId, selectionId)()
  const { select } = menu || {}
  const params = {
    keylabel: selectionId
  }
  const response = await axios.postWithAuth('/query/select', { sql: sqlSelect(select[0], params) })
  if (response.data?.status === 'error') {
    throw new Error(response.data?.message)
  }
  const data = (response.data?.data || []).map(item => mapValues(item, value => parseJSON(value) || value))
  const names = data.map(item => `name="${item.name}"`)
  const roots = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: 'name, value', from: 'lang_values', where: names.join(' OR ') }) })
  const rootNames = (roots.data?.data || []).map(item => {
    let forms = data.find(form => form.name === item.name) || []
    forms = forms.forms?.split(',')
    return { ...item, forms }
  })

  const forms = data.reduce((acc, item) => [
    ...acc,
    ...(item.forms || '').split(',').map(form => `name="${form}"`)
  ], [])
  const res = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: '*', from: 'lang_values', where: forms.join(' OR ') }) })
  let subitems = res.data?.data || []
  const formsId = data.reduce((acc, item) => [
    ...acc,
    ...(item.forms || '').split(',').map(form => ['JSON_EXTRACT(pole, "$.lang_values_name")', `"${form}"`])
  ], [])
  const res2 = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: '*', from: 'metabase', where: formsId.map(item => item.join('=')).join(' OR ') }) })
  const subitemsData = (res2.data?.data || []).map(item => ({ ...item, ...parseJSON(item.pole) }))
  
  subitems = subitems.map(item => {
    const data = subitemsData.find(subitem => subitem.lang_values_name === item.name)
    return { ...item, id: data.id }
  })
  
  const navItems = []
  rootNames.forEach(root => {
    const sub = subitems.filter(item => root.forms.includes(item.name))
    const item = {
      key: root.name,
      label: root.value,
      children: sub.map(subitem => ({
        key: subitem.name,
        label: <Link to={`/metabase/${subitem.id}`}>{subitem.value}</Link>
      }))
    }
    navItems.push(item)
  })

  let res3 = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: '*', from: 'metabase', where: formsId.map(item => item.join('!=')).join(' AND ') }) })
  res3 = (res3.data?.data || [])
  res3.forEach(item => {
    const json = parseJSON(item.pole)
    navItems.push({
      key: item.id,
      label: <Link to={`/metabase/${item.id}`}>{json.name}</Link>
    })
  })
  console.log(navItems)
  return navItems
})