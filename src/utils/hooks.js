import { useQuery } from 'react-query'
import { get as _get, keyBy } from 'lodash'
import axios from './axios'
import { toFormData } from './utils'

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
    if (!user.json) {
      user.json = {}
    } else {
      try {
        user.json = JSON.parse(user.json)
      } catch (e) {
        console.warn(e)
      }
    }
    return user
  })
  return userId ? users[0] : users
})

export const useUsersWithRole = role => useQuery(['usersWithRole', role], async () => {
  const response = await axios.postWithAuth('/query/select', { sql: `SELECT id_user, name, family, middle, json FROM users WHERE id_role=${role} AND active=1 AND deleted!=1 AND id_verification_status${role === 2 ? '=2' : ' is null'}` })
  const users = (response.data?.data || []).map(user => {
    try {
      user.json = JSON.parse(user.json)
    } catch (e) {
      console.warn(e)
    }
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
    let json = {}
    try {
      json = JSON.parse(item.pole)
    } catch (e) {
      json = {}
    }
    return json
  })
  const map = keyBy(list, 'value')
  return { list, map }
}, {
  staleTime: 10 * 60 * 1000
})