import { useMemo, useState } from 'react'
import { Table, Typography, Row, Col, Button, Modal } from 'antd'
import { useQuery } from 'react-query'
import { useNavigate, useParams } from 'react-router-dom'
import DatasetForm from '../DatasetForm'
import { ModalSqlError } from '../SqlError'
import axios from '../../utils/axios'
import { sqlSelect } from '../../utils/sql'
import styles from './styles.module.scss'

export default function DatasetTable({
  select = [],
  fields = {},
  insert = {},
  update = {},
  selection = {},
  route
}) {
  const navigate = useNavigate()
  const { selectionId: id, itemId } = useParams()
  const [ widthByIndex, setWidthByIndex ] = useState({})
  const { data = [], isLoading, refetch } = useQuery([`dataset-table-${route}`, id], async () => {
    const response = await axios.postWithAuth('/query/select', { sql: sqlSelect(select[0]) })

    if (response.data?.status === 'error') {
      throw new Error(response.data?.message)
    }
    const data = response.data?.data
    return data
  }, {
    onError: (error) => ModalSqlError({ message: error?.message }),
    retry: 0
  })

  const handleResize = (event, field) => {
    const el = event.target
    const th = el.parentNode
    const initialWidth = th.clientWidth
    const initialLeft = event.clientX
  
    const handleMouseMove = e => {
      const currentLeft = e.clientX
      const offset = currentLeft - initialLeft
      const width = initialWidth + offset
      setWidthByIndex({ ...widthByIndex, [field]: width })
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const isModal = !isLoading && !!itemId
  const columns = useMemo(() => Object.keys(fields).map((field, i) => ({
    width: widthByIndex[field],
    title: <>
      {false && i < Object.keys(fields).length - 1 &&
        <div
          className={styles.resizeArea}
          onMouseDown={e => handleResize(e, field)}
        />
      }
      {fields[field].label}
    </>,
    dataIndex: field
  })), [fields, widthByIndex])
  const currentItem = useMemo(() => data.find(item => item.id === itemId), [data, itemId])

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
            onClick={() => navigate(`/${route}/${id}/create`)}
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
            navigate(`/${route}/${id}/${record.id}`)
          }
        })}
      />
      {isModal && <DatasetForm
        id={itemId}
        fields={fields}
        initialValues={currentItem}
        onOk={async (values) => {
          let sql = itemId === 'create' ? (insert?.i1 || '') : (update?.u1 || '')
          Object.keys(values).map(key => {
            sql = sql.replaceAll(`:${key}`, values[key])
          })
          const response = await axios.postWithAuth(`/query/${itemId === 'create' ? 'insert' : 'update'}`, { sql })
          const { data = {} } = response
          if (data.status === 'error') {
            ModalSqlError({ message: data.message, query: sql })
          } else {
            navigate(`/${route}/${id}`)
            refetch()
          }
        }}
        onCancel={() => navigate(`/${route}/${id}`)}
      />}
    </>
  )
}