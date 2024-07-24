export const sqlSelect = ({
  select,
  from,
  where,
  order = ''
} = {}, replace = {}) => {
  
  let query = `select ${select} from ${from} ${where ? `where ${where}` : ''} ${order}`
  
  Object.keys(replace).forEach(key => {
    query = query.replaceAll(`:${key}`, replace[key])
  })
  return query
}

export const sqlInsert = (table, values) => {
  if (Array.isArray(values)) {
    return `INSERT INTO ${table} VALUES (${values.map(val => typeof val === 'string' && val !== 'NULL' ? `'${val}'` : val).join(', ')})`
}

  const [ fields, vals ] = Object.keys(values).reduce((acc, key) => {
    acc[0] = acc[0].concat(`\`${key}\``)
    let value = values[key]
    if (typeof value === 'string' && value !== 'NULL') {
      value = `'${value}'`
    }
    acc[1] = acc[1].concat(value)
    return acc
  }, [[], []])
  return `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${vals.join(', ')})`
}

export const sqlUpdate = (table, values, where) => {
  const set = Object.keys(values).map(key => {
    const val = typeof values[key] === 'string' && values[key] !== 'NULL' ? `'${values[key]}'` : values[key]
    return `\`${key}\`=${val}`
  }).join(',')
  return `UPDATE ${table} SET ${set} WHERE ${where}`
}