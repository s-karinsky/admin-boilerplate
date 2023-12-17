import { useMemo } from 'react'
import { Table, Typography, Row, Col, Button, Modal } from 'antd'
import { useQuery } from 'react-query'
import { useNavigate, useParams } from 'react-router-dom'
import DatasetForm from '../DatasetForm'
import axios from '../../utils/axios'
import { sqlSelect } from '../../utils/sql'

const getColumns = fields => Object.keys(fields).map(field => ({
  title: fields[field].label,
  dataIndex: field
}))

export default function DatasetTable({
  id,
  select = [],
  fields = {},
  insert = {},
  update = {},
  selection = {}
}) {
  const navigate = useNavigate()
  const { itemId } = useParams()
  const { data = [], isLoading, refetch } = useQuery(['dataset-table', id], async () => {
    const response = await axios.postWithAuth('/query/select', { sql: sqlSelect(select[0]) })

    if (response.data?.status === 'error') {
      throw new Error(response.data?.message)
    }
    const data = response.data?.data
    return data
  }, {
    onError: (error) => Modal.error({ title: 'Произошла ошибка', content: error?.message }),
    retry: 0
  })

  const isModal = !isLoading && !!itemId
  const columns = useMemo(() => getColumns(fields), [fields])
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
            onClick={() => navigate(`/selections/${id}/create`)}
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
            navigate(`/selections/${id}/${record.id}`)
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
            Modal.error({ title: 'Произошла ошибка', content: data.message })
          } else {
            navigate(`/selections/${id}`)
            refetch()
          }
        }}
        onCancel={() => navigate(`/selections/${id}`)}
      />}
    </>
  )
}