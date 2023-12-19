import { useMemo, useState, useEffect } from 'react'
import { Table, Typography, Row, Col, Button } from 'antd'
import { useQuery } from 'react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { mapValues } from 'lodash'
import DatasetForm from '../DatasetForm'
import { ModalSqlError } from '../SqlError'
import axios from '../../utils/axios'
import { sqlSelect } from '../../utils/sql'
import { parseJSON } from '../../utils/utils'
import styles from './styles.module.scss'

const getCellsWidth = (route, selectionId) => parseJSON(localStorage.getItem(`${route}-${selectionId}-cell-size`)) || {}

export default function DatasetTable({
  select = [],
  fields = [],
  insert = {},
  update = {},
  selection = {},
  route
}) {
  const navigate = useNavigate()
  const { selectionId, itemId } = useParams()
  const [ widthByIndex, setWidthByIndex ] = useState(getCellsWidth(route, selectionId))
  const { data = [], isLoading, refetch } = useQuery([`dataset-table-${route}`, selectionId], async () => {
    const response = await axios.postWithAuth('/query/select', { sql: sqlSelect(select[0]) })
    if (response.data?.status === 'error') {
      throw new Error(response.data?.message)
    }
    const data = response.data?.data
    return data.map(item => mapValues(item, value => parseJSON(value) || value))
  }, {
    onError: (error) => ModalSqlError({ message: error?.message }),
    retry: 0
  })

  useEffect(() => {
    setWidthByIndex(getCellsWidth(route, selectionId))
  }, [selectionId])

  const handleResize = (event, field) => {
    const el = event.target
    const th = el.parentNode
    const tr = th.parentNode
    const fullWidth = tr.clientWidth
    const initialWidth = th.clientWidth
    const initialLeft = event.clientX
    let byIndex = {}
  
    const handleMouseMove = e => {
      const currentLeft = e.clientX
      const offset = currentLeft - initialLeft
      const width = (((initialWidth + offset) / fullWidth) * 100).toFixed(2)
      byIndex = { ...widthByIndex, [field]: `${width}%` }
      setWidthByIndex(byIndex)
    }

    const handleMouseUp = () => {
      localStorage.setItem(`${route}-${selectionId}-cell-size`, JSON.stringify(byIndex))
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const isModal = !isLoading && !!itemId
  const columns = useMemo(() => fields.map((field, i) => ({
    width: widthByIndex[field.name],
    title: <>
      {i < fields.length - 1 &&
        <div
          className={styles.resizeArea}
          onMouseDown={e => handleResize(e, field.name)}
        />
      }
      <span className={styles.tableLabel}>{field.label}</span>
    </>,
    dataIndex: field.name
  })), [fields, widthByIndex])
  const currentItem = useMemo(() => data.find(item => String(item.id) === String(itemId)), [data, itemId])

  return (
    <>
      <Row
        justify='space-between'
        align='bottom'
        style={{ margin: '0 20px 20px' }}
      >
        <Col>
          <Typography.Title>{selection.name}</Typography.Title>
        </Col>
        <Col>
          <Button
            type='primary'
            onClick={() => navigate(`/${route}/${selectionId}/create`)}
          >
            Создать запись
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={data}
        isLoading={isLoading}
        rowKey={({ id }) => id}
        onRow={record => ({
          onClick: (e) => {
            navigate(`/${route}/${selectionId}/${record.id}`)
          }
        })}
      />
      {isModal && <DatasetForm
        query={sqlSelect(select[0])}
        fields={fields}
        initialValues={currentItem}
        onOk={async (values) => {
          let sql = itemId === 'create' ? (insert?.i1 || '') : (update?.u1 || '')
          Object.keys(values).forEach(key => {
            sql = sql.replaceAll(`:${key}`, values[key])
          })
          const response = await axios.postWithAuth(`/query/${itemId === 'create' ? 'insert' : 'update'}`, { sql })
          const { data = {} } = response
          if (data.status === 'error') {
            ModalSqlError({ message: data.message, query: sql })
          } else {
            navigate(`/${route}/${selectionId}`)
            refetch()
          }
        }}
        onCancel={() => navigate(`/${route}/${selectionId}`)}
      />}
    </>
  )
}