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

const getFormDescription = (table, name, langId = 1) => async () => {
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

  const fieldsWithTranslate = Object.values(config.fields).filter(val => val.lang_values_name).map(val => `name="${val.lang_values_name}"`)
  const translateData = fieldsWithTranslate.length > 0 ? 
    await axios.postWithAuth('/query/select', {
      sql: sqlSelect({ select: '*', from: 'lang_values', where: `(${fieldsWithTranslate.join(' OR ')}) AND id_lang=${langId}` })
    } )
    :
    Promise.resolve({})
  const tDataMap = (translateData.data?.data || []).reduce((acc, item) => ({
    ...acc,
    [item.name]: item.value
  }), {})

  config.fields = Object.keys(config.fields)
    .sort((a, b) => config.fields[a].order - config.fields[b].order)
    .map(name => ({
      name,
      ...config.fields[name],
      label: tDataMap[config.fields[name].lang_values_name] || config.fields[name].label,
      props: {
        ...config.fields[name]?.props,
        label: tDataMap[config.fields[name].lang_values_name] || config.fields[name].label
      }
    }))

  return config
}

export const useFormDescription = (name, table = 'metabase', langId) => useQuery([table, name, langId], getFormDescription(table, name, langId), {
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

export const useMainNav = (langId = 1, params) => useQuery(['main-nav', langId], async () => {
  const responseSetions = await axios.postWithAuth('/query/select', { sql: `
    SELECT JSON_MERGE(pole,JSON_OBJECT('translated_name',(SELECT value FROM lang_values WHERE name=JSON_UNQUOTE(JSON_EXTRACT(pole, '$.lang_values_name')) AND id_lang=${langId} LIMIT 1),'table_name','metabase','forms', (SELECT CONCAT('[',GROUP_CONCAT(JSON_MERGE(pole,JSON_OBJECT('id',a.id)) ),']') FROM metabase as a WHERE a.id_ref=b.id AND tip='forma'))) as menu_section FROM metabase as b WHERE tip='menu_section'
    UNION
    SELECT JSON_MERGE(pole,JSON_OBJECT('translated_name',(SELECT value FROM lang_values WHERE name=JSON_UNQUOTE(JSON_EXTRACT(pole, '$.lang_values_name')) AND id_lang=${langId} LIMIT 1),'table_name','metaadm','forms', (SELECT CONCAT('[',GROUP_CONCAT(JSON_MERGE(pole,JSON_OBJECT('id',c.id)) ),']') FROM metaadm as c WHERE c.id_ref=d.id AND tip='forma'))) as menu_section FROM metaadm as d WHERE tip='menu_section';
  `})
  const sections = (responseSetions.data?.data || []).map(item => {
    const section = parseJSON(item.menu_section)
    const forms = parseJSON(section.forms)
    return { ...section, forms }
  })
  const rootSections = await Promise.all(
    sections.map(section => {
      const where = (section.forms || []).map(form => `name="${form.lang_values_name}"`).join(' OR ')
      return axios.postWithAuth('/query/select', { sql: sqlSelect({ select: '*', from: 'lang_values', where: `(${where}) AND id_lang=${langId}` }) })
        .then(res => ({ ...section, translate: keyBy(res.data?.data || [], 'name') }))
    })
  ).then(parents => parents.map(parent => {
    var menu_section_table_name = parent.table_name
    const { name, forms, translate,translated_name } = parent

    const children = (forms || []).map(form => ({
      key: form.lang_values_name,
      label: <Link to={`/${menu_section_table_name}/${form.id}`}>{translate[form.lang_values_name]?.value || form.lang_values_name}</Link>
    }))
    return { key: name, label: translated_name, children }
  }))

  const uncat = await axios.postWithAuth('/query/select', { sql: `
    SELECT id,json_unquote(JSON_EXTRACT(pole, "$.name")) as	\`name\`,json_unquote(JSON_EXTRACT(pole, "$.lang_values_name")) as \`lang_values_name\`,'metabase' as table_name FROM metabase WHERE tip='forma' AND id_ref NOT IN ((SELECT id FROM metabase WHERE tip='menu_section'))
    UNION
    SELECT id,json_unquote(JSON_EXTRACT(pole, "$.name")) as	\`name\`,json_unquote(JSON_EXTRACT(pole, "$.lang_values_name")) as \`lang_values_name\`,'metaadm' as table_name FROM metaadm WHERE tip='forma' AND id_ref NOT IN ((SELECT id FROM metaadm WHERE tip='menu_section'));
  ` })
  let rootItems = (uncat.data?.data || []).map(item => ({ ...item, ...parseJSON(item.pole) }))
  const where = rootItems.map(item => `name="${item.lang_values_name}"`).join(' OR ')
  const uncatTranslates = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: '*', from: 'lang_values', where: `(${where}) AND id_lang=${langId}` }) })
  const mapTranslates = keyBy(uncatTranslates.data?.data, 'name')
  rootItems = rootItems.map(item => ({
    key: item.id,
    label: <Link to={`/metabase/${item.id}`}>{mapTranslates[item.lang_values_name]?.value || item.lang_values_name}</Link>
  }))
  return rootSections.concat(rootItems)

  // const selectionId = 65
  // const parentId = 'metaadm'
  // const menu = await getFormDescription(parentId, selectionId)()
  // const { select } = menu || {}
  // const params = {
  //   keylabel: selectionId
  // }

  // // Базовая выборка родительских пунктов меню
  // const response = await axios.postWithAuth('/query/select', { sql: sqlSelect(select[0], params) })
  // if (response.data?.status === 'error') {
  //   throw new Error(response.data?.message)
  // }
  // if (!response.data?.data?.length) {
  //   return []
  // }
  // const data = (response.data?.data || []).map(item => mapValues(item, value => parseJSON(value) || value))
  
  // // Формирование условия для выборки названия форм на выбранном языке
  // const names = data.map(item => `name="${item.name}"`)
  // if (!names.length) return []
  // const roots = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: 'name, value', from: 'lang_values', where: `(${names.join(' OR ')}) AND id_lang=${langId}` }) })
  // const rootNames = data.map((item, i) => {
  //   let lang = (roots.data?.data || []).find(form => form.name === item.name) || {}
  //   return {
  //     name: lang.name || `Unknown ${i + 1}`,
  //     value: lang.value || `Unknown ${i + 1}`,
  //     forms: item.forms?.split(',') || []
  //   }
  // })

  // const forms = data.reduce((acc, item) => [
  //   ...acc,
  //   ...(item.forms || '').split(',').map(form => `name="${form}"`)
  // ], [])
  // const res = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: '*', from: 'lang_values', where: `(${forms.join(' OR ')}) AND id_lang=${langId}` }) })

  // const formsId = data.reduce((acc, item) => [
  //   ...acc,
  //   ...(item.forms || '').split(',').map(form => ['JSON_EXTRACT(pole, "$.lang_values_name")', `"${form}"`])
  // ], [])
  // const res2 = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: '*', from: 'metabase', where: formsId.map(item => item.join('=')).join(' OR ') }) })

  // const subitemsData = (res2.data?.data || []).map(item => ({ ...item, ...parseJSON(item.pole) }))
  // const subitems = subitemsData.map((item, i) => {
  //   const data = (res.data?.data || []).find(subitem => item.lang_values_name === subitem.name)
  //   return { name: item.lang_values_name, value: data?.value || `Unknown ${i + 1}`, id: item.id }
  // })

  // const navItems = []
  // rootNames.forEach(root => {
  //   const sub = subitems.filter(item => root.forms.includes(item.name))
  //   const item = {
  //     key: root.name,
  //     label: root.value,
  //     children: sub.map(subitem => ({
  //       key: subitem.name,
  //       label: <Link to={`/metabase/${subitem.id}`}>{subitem.value}</Link>
  //     }))
  //   }
  //   navItems.push(item)
  // })

  // let res3 = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: '*', from: 'metabase', where: formsId.map(item => item.join('!=')).join(' AND ') }) })
  // res3 = (res3.data?.data || [])
  // res3.forEach(item => {
  //   const json = parseJSON(item.pole)
  //   navItems.push({
  //     key: item.id,
  //     label: <Link to={`/metabase/${item.id}`}>{json.name}</Link>
  //   })
  // })

  // res3 = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: '*', from: 'metaadm', where: 'tip="forma"'}) })
  // const adm = {
  //   key: 'admin',
  //   label: 'Admin',
  //   children: []
  // }
  // res3 = (res3.data?.data || [])
  // res3.forEach(item => {
  //   const json = parseJSON(item.pole)
  //   if (typeof json.name !== 'string') return
  //   adm.children.push({
  //     key: `adm-${item.id}`,
  //     label: <Link to={`/metaadm/${item.id}`}>{json.name}</Link>
  //   })
  // })
  // navItems.push(adm)

  // return navItems
}, params)

export const useLangs = () => useQuery(['languages'], async () => {
  const res = await axios.postWithAuth('/query/select', { sql: sqlSelect({ select: '*', from: 'lang', where: 'active=1'}) })
  const langs = res.data?.data || []
  return langs
})
