import { map, uniq, orderBy } from 'lodash'
import dayjs from 'dayjs'
import { INJECTED_FIELDS_QUOTES } from '../consts'

export const capitalizeFirstLetter = str => {
  return str[0].toUpperCase() + str.substr(1)
}

export const getFileExt = (fileName, withDot = false) => {
  if (!fileName || typeof fileName !== 'string') return ''
  const parts = fileName.split('.')
  const ext = parts[parts.length - 1]
  return withDot ? `.${ext}` : ext
}

export const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
})

export const getOptions = (arr, path) =>
  orderBy(uniq(map(arr, path))).filter(item => item)

export const declOfNum = (number, titles) => {  
  const cases = [2, 0, 1, 1, 1, 2]
  return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ]
}

export const filterTableRows = search => item => {
  if (!search) return true
  const str = Object.values(item).map(
    val => typeof(val) ==='string' && val.length >= 10 && dayjs(val).isValid() ? dayjs(val).format('DD.MM.YYYY') : val
  ).join(';').toLowerCase()
  return str.includes(search.toLowerCase())
}

export const numberFormatter = digits => (val, { userTyping, input }) => userTyping ? input : `${Number(val).toFixed(digits)}`.replace('.', ',')

export const toFormData = params => {
  const data = new FormData()
  Object.keys(params).forEach(key => {
    data.append(key, params[key])
  })
  return data
}

export const parseJSON = (str, isWarning) => {
  let json
  try {
    json = JSON.parse(str)
  } catch (e) {
    if (isWarning) console.warn(e)
  }
  return json
}

export const replaceQueryFields = (query, { values = {}, oldValues = {}, fields = [] }) => {
  Object.keys(values).forEach(key => {
    const field = fields.find(item => item.name === key)
    const withQuotes = field ? (field.withQuotes || true) : INJECTED_FIELDS_QUOTES[key]
    query = query.replaceAll(`:${key}`, withQuotes ? `"${values[key] ?? ''}"` : (values[key] ?? ''))
  })
  Object.keys(oldValues).forEach(key => {
    const field = fields.find(item => item.name === key)
    const withQuotes = field ? (field.withQuotes || true) : INJECTED_FIELDS_QUOTES[key]
    query = query.replaceAll(`:~${key}`, withQuotes ? `"${values[key] ?? ''}"` : (values[key] ?? ''))
  })
  return query
}