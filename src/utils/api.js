import { get as _get } from 'lodash'
import Cookies from 'universal-cookie'
import axios from './axios'
import { parseJSON, toFormData } from './utils'
import { sqlUpdate, sqlInsert } from './sql'

export const login = async (values) => {
  const response = await axios.post('/auth', toFormData({ ...values, type: 'e-mail' }))
  const { data } = response
  if (!data.auth_hash || !['2', '4'].includes(data.auth_user?.u_role)) {
    return false
  }
  const responseTokens = await axios.post('/token', toFormData({ auth_hash: data.auth_hash }))
  const tokens = responseTokens.data?.data
  if (tokens) {
    const cookies = new Cookies()
    cookies.set('token', tokens.token)
    cookies.set('u_hash', tokens.u_hash)
  }
  return data.auth_user?.u_role
}

export const getCount = async (db, where) => {
  const response = await axios.postWithAuth('/query/select', { sql: `SELECT count(*) FROM ${db}${where ? ' WHERE '+where : ''}` })
  const count = _get(response, ['data', 'data', 0, 'count(*)'])
  return count
}

export const getLastId = async (table, id = 'id') => {
  const response = await axios.postWithAuth('/query/select', { sql: `SELECT max(${id}) as max FROM ${table}` })
  const count = _get(response, ['data', 'data', 0, 'max'])
  return count
}

export const updateUserById = async (userId, values = {}) => {
  const response = await axios.postWithAuth('/query/update', { sql: sqlUpdate('users', values, `id_user=${userId}`) })
  return response
}

export const createUser = async (values) => {
  await axios.postWithAuth('/query/insert', { sql: sqlInsert('users', values) })
  const lastId = await getLastId('users', 'id_user')
  return lastId
}

export const getSelections = (table) => async () => {
  const response = await axios.postWithAuth('/query/select', { sql: `SELECT * FROM ${table} WHERE tip='forma'` })
  const data = response.data?.data
  return data.map(item => {
    const json = parseJSON(item.pole)
    return {
      id: item.id,
      label: json.name || item.id
    }
  })
}

export const updateLanguage = async (langId) => {
  const res = await axios.postWithAuth('/user', { data: JSON.stringify({ u_lang: langId }) })
  return res
}