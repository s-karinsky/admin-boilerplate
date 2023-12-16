import dayjs from 'dayjs'
import { get as _get } from 'lodash'
import Cookies from 'universal-cookie'
import axios from './axios'
import { toFormData } from './utils'
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

export const getSendings = isAir => async () => {
  const [ response, responseProducts ] = await Promise.all([
    axios.postWithAuth('/query/select', { sql: `SELECT * FROM trip WHERE \`to\`='${Number(isAir)}' AND canceled=0` }),
    axios.postWithAuth('/query/select', { sql: `SELECT id_trip, sum(JSON_EXTRACT(n.pole,'$.gross_weight')) AS gross_weight, sum(JSON_EXTRACT(n.pole,'$.net_weight')) AS net_weight, sum(JSON_EXTRACT(n.pole,'$.count')) AS count FROM trip t LEFT JOIN dataset m ON m.id_ref=t.id_trip LEFT JOIN dataset n ON n.id_ref=m.id WHERE canceled=0 AND \`to\`=0 GROUP BY id_trip` })
  ])
  
  const productsMap = (responseProducts.data?.data || []).reduce((acc, item) => ({
    ...acc,
    [item.id_trip]: item
  }), {})

  const data = response.data?.data || []
  return data.map(item => {
    let json
    try {
      json = JSON.parse(item.json.replaceAll("\n", ''))
    } catch (e) {
      console.warn(e)
      json = {}
    }

    return {
      id: item.id_trip,
      code: item.from,
      date: item.create_datetime,
      transporter: json.transporter,
      status: json.status,
      count: productsMap[item.id_trip]?.count || 0,
      net_weight: productsMap[item.id_trip]?.net_weight || 0,
      gross_weight: productsMap[item.id_trip]?.gross_weight || 0,
      departure: item.start_datetime,
      delivery: item.complete_datetime,
      json
    }
  })
}

export const getSendingById = sendingId => async () => {
  if (sendingId === 'create') {
    const response = await axios.postWithAuth(
      '/query/select',
      {
        sql: `SELECT max(cast(\`from\` as decimal)) as max FROM trip WHERE canceled=0 AND YEAR(create_datetime) = YEAR('${dayjs().format('YYYY-MM-DD')}')`
      }
    )
    const data = response.data?.data || []
    const number = parseInt(_get(data, [0, 'max'])) || 0
    return {
      from: number + 1,
      create_datetime: dayjs(),
      json: {
        status: 0
      }
    }
  } else {
    const [ response, responseProducts ] = await Promise.all([
      axios.postWithAuth('/query/select', { sql: `SELECT * FROM trip WHERE id_trip=${sendingId}` }),
      axios.postWithAuth('/query/select', { sql: `SELECT id_trip, sum(JSON_EXTRACT(n.pole,'$.gross_weight')) AS gross_weight, sum(JSON_EXTRACT(n.pole,'$.net_weight')) AS net_weight, sum(JSON_EXTRACT(n.pole,'$.count')) AS count FROM trip t LEFT JOIN dataset m ON m.id_ref=t.id_trip LEFT JOIN dataset n ON n.id_ref=m.id WHERE m.ref_tip='sending' AND m.id_ref=${sendingId} AND m.status=0 GROUP BY id_trip` })
    ])
    const products = (responseProducts.data?.data || [])[0] || {}
    const item = (response.data?.data || [])[0] || {}
    try {
      item.json = JSON.parse(item.json.replaceAll("\n", ''))
    } catch (e) {
      console.warn(e)
    }
    item.create_datetime = dayjs(item.create_datetime)
    item.start_datetime = item.json?.status > 0 && dayjs(item.json?.status_date_1)
    item.complete_datetime = item.json?.status > 1 && dayjs(item.json?.status_date_2)
    item.gross_weight = products.gross_weight
    item.net_weight = products.net_weight
    item.count = products.count
    return item
  }
}

export const deleteSendingById = async (sendingId) => {
  const response = await axios.postWithAuth('/query/update', { sql: sqlUpdate('trip', { canceled: 1 }, `id_trip=${sendingId}`) })
  return response
}

export const updateSendingById = async (sendingId, params = {}) => {
  const response = await axios.postWithAuth('/query/update', { sql: sqlUpdate('trip', params, `id_trip=${sendingId}`) })
  return response
}

export const createSending = async (values) => {
  const response = await axios.postWithAuth('/query/insert', { sql: sqlInsert('trip', values) })
  return response
}

export const getPlacesBySendingId = sendingId => async () => {
  if (sendingId === 'create') return []

  const sql = `SELECT * FROM dataset WHERE ref_tip='sending' AND id_ref=${sendingId} AND status=0`
  const [ response, responseProducts ] = await Promise.all([
    axios.postWithAuth('/query/select', { sql }),
    axios.postWithAuth('/query/select', { sql: `SELECT t.id, sum(JSON_EXTRACT(n.pole,'$.gross_weight')) AS gross_weight, sum(JSON_EXTRACT(n.pole,'$.count')) AS count FROM dataset t LEFT JOIN dataset n ON n.id_ref=t.id WHERE t.tip='place' AND t.id_ref=${sendingId} AND t.status=0 GROUP BY t.id` })
  ])
  
  const productsMap = (responseProducts.data?.data || []).reduce((acc, item) => ({
    ...acc,
    [item.id]: item
  }), {})
  const data = response.data?.data || []
  return data.map(item => {
    let json
    try {
      json = JSON.parse(item.pole)
    } catch (e) {
      json = {}
    }
    return {
      ...item,
      ...json,
      count: productsMap[item.id]?.count
    }
  })
}

export const getPlaceById = (placeId, sendingId, params = {}) => async () => {
  let values = {}
  if (placeId === 'create') {
    const response = await axios.postWithAuth(
      '/query/select',
      {
        sql: `SELECT max(cast(JSON_EXTRACT(pole,'$.place') as decimal)) as max FROM dataset WHERE id_ref=${sendingId} AND ref_tip='sending'`
      }
    )
    values = {
      place: parseInt(_get(response, ['data', 'data', 0, 'max']) || 0) + 1
    }
    if (!params.copy) return values
  }
  const sql = params.copy ? `SELECT * FROM dataset WHERE id=${params.copy}` : `SELECT * FROM dataset WHERE id=${placeId}`
  const response = await axios.postWithAuth('/query/select', { sql })
  const data = (response.data?.data || [])[0]
  let json
  try {
    json = JSON.parse(data.pole)
  } catch (e) {
    json = {}
  }
  return {
    ...data,
    ...json,
    ...values
  }
}

export const deletePlaceById = async (placeId) => {
  const response = await axios.postWithAuth('/query/update', { sql: sqlUpdate('dataset', { status: 1 }, `id=${placeId}`) })
  return response
}

export const updateDatasetById = async (placeId, params = {}) => {
  const response = await axios.postWithAuth('/query/update', { sql: sqlUpdate('dataset', params, `id=${placeId}`) })
  return response.data
}

export const createDataset = async (params) => {
  const response = await axios.postWithAuth('/query/insert', { sql: sqlInsert('dataset', params) })
  return response.data
}

export const getProductsByPlaceId = placeId => async () => {
  const response = await axios.postWithAuth('/query/select', {
    sql: `SELECT * FROM dataset WHERE id_ref=${placeId} AND ref_tip='place' AND status=0`
  })
  const data = response.data?.data || []
  return data.map(item => {
    let json
    try {
      json = JSON.parse(item.pole)
    } catch (e) {
      json = {}
    }
    return {
      ...item,
      ...json
    }
  })
}

export const deleteProductById = async (productId) => {
  const response = await axios.postWithAuth('/query/update', { sql: sqlUpdate('dataset', { status: 1 }, `id=${productId}`) })
  return response
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
