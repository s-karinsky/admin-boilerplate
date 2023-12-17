import { useQuery } from 'react-query'
import { get as _get, keyBy, eq } from 'lodash'
import axios from './axios'
import { toFormData, parseJSON } from './utils'

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

export const useUsersWithRole = role => useQuery(['usersWithRole', role], async () => {
  const response = await axios.postWithAuth('/query/select', { sql: `SELECT id_user, name, family, middle, json FROM users WHERE id_role=${role} AND active=1 AND deleted!=1 AND id_verification_status${role === 2 ? '=2' : ' is null'}` })
  const users = (response.data?.data || []).map(user => {
    user.json = parseJSON(user.json)
    return user
  })
  return users
}, {
  staleTime: 5 * 60 * 1000
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

export const useDictionary = name => useQuery(['dictionary', name], async () => {
  const response = await axios.postWithAuth('/query/select', { sql: `SELECT * FROM sprset WHERE tip='${name}'` })
  const list = (_get(response, ['data', 'data']) || []).map(item => {
    let json = parseJSON(item.pole) || {}
    return json
  })
  const map = keyBy(list, 'value')
  return { list, map }
}, {
  staleTime: 10 * 60 * 1000
})

export const useFormDescription = name => useQuery(['form', name], async () => {
  const response = await axios.postWithAuth('/query/select', {
    sql: `select v.pole as selection, s.pole as \`select\`, f.pole as \`from\`, o.pole as \`order\`, i.pole as field, t.pole as \`insert\`, u.pole as \`update\`, d.pole as \`delete\` from metabase m
      left join metabase v on v.id_ref=m.id and v.tip='selection'
      left join metabase s on s.id_ref=v.id and s.tip='select'
      left join metabase i on i.id_ref=s.id and i.tip='field_select'
      left join metabase f on f.id_ref=v.id and f.tip='from_select'
      left join metabase o on o.id_ref=v.id and o.tip='order_select'
      left join metabase t on t.id_ref=v.id and t.tip='insert_selection'
      left join metabase u on u.id_ref=v.id and u.tip='update_selection'
      left join metabase d on d.id_ref=v.id and d.tip='delete_selection'
    where m.tip='forma' and m.id=${name}`.replaceAll('\n', ' ')
  })
  const data = response.data?.data || []
  const config = data.reduce((acc, item) => {
    let sqlSelect = {
      select: parseJSON(item.select)?.clause,
      from: parseJSON(item.from)?.clause,
      order: parseJSON(item.order)?.order
    }
    if (!acc.select.find(item => !eq(item, sqlSelect))) {
      acc.select.push(sqlSelect)
    }
    acc.selection = { ...acc.selection, ...parseJSON(item.selection) }
    acc.fields = { ...acc.fields, ...parseJSON(item.field) }
    acc.insert = { ...acc.insert, ...parseJSON(item.insert) }
    acc.update = { ...acc.update, ...parseJSON(item.update) }
    return acc
  }, {
    selection: {},
    fields: {},
    insert: {},
    update: {},
    select: []
  })
  return config
}, {
  staleTime: 600 * 1000
})