import { useMemo, useState, useEffect } from 'react'
import { Table, Typography, Row, Col, Button, Modal } from 'antd'
import { useQuery } from 'react-query'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { mapValues } from 'lodash'
import { MenuOutlined, ExclamationCircleFilled, DeleteOutlined } from '@ant-design/icons'
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
  deleteQuery = {},
  selection = {},
  queryId = {},
  route
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectionId, itemId } = useParams()
  const [ searchParams ] = useSearchParams()
  const [ widthByIndex, setWidthByIndex ] = useState(getCellsWidth(route, selectionId))
  const params = {}
  searchParams.forEach((value, key) => params[key] = value)
  if (params.id) params.id = parseInt(params.id)
  else params.id = parseInt(selectionId)

  const { data = [], isLoading, refetch } = useQuery([`dataset-table-${route}`, selectionId], async () => {
    const response = await axios.postWithAuth('/query/select', { sql: sqlSelect(select[0], params) })
    if (response.data?.status === 'error') {
      throw new Error(response.data?.message)
    }
    const data = response.data?.data
    return data.map(item => mapValues(item, value => parseJSON(value) || value))
  }, {
    onError: (error) => {
      const params = {}
      searchParams.forEach((value, key) => params[key] = value)
      if (params.id) params.id = parseInt(params.id) + 1
      ModalSqlError({ message: error?.message, query: sqlSelect(select[0], params) })
    },
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
  const columns = useMemo(() => {
    const cols = fields.map((field, i) => ({
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
    }))
    cols.push({
      title: '',
      width: 30,
      dataIndex: '_buttons'
    })
    return cols
  }, [fields, widthByIndex, selection])

  const dataSource = useMemo(() => {
    return data.map(item => {
      const buttons = []
      if (deleteQuery.d1) {
        buttons.push(
          <DeleteOutlined
            color='red'
            onClick={(e) => {
              e.stopPropagation()
              Modal.confirm({
                title: 'Вы действительно хотите удалить эту запись?',
                icon: <ExclamationCircleFilled />,
                okText: 'Да',
                okType: 'danger',
                cancelText: 'Нет',
                onOk: async () => {
                  let sql = deleteQuery.d1
                  Object.keys(item).forEach(key => {
                    sql = sql.replaceAll(`:${key}`, item[key])
                  })
                  const query = sql.includes('update') ? 'update' : 'delete'
                  await axios.postWithAuth(`/query/${query}`, { sql })
                  refetch()
                }
              })
            }}
          />
        )
      }
      if (selection.kod === 'selection_list') {
        buttons.push(
          <MenuOutlined
            onClick={e => {
              e.stopPropagation()
              navigate(`/metaadm/${selectionId}/list/30?id=${item.id}`)
            }}
          />
        )
      }
      return {
        ...item,
        _buttons: buttons
      }
    })
  }, [selection, data])

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
          {!!insert.i1 && <Button
            type='primary'
            onClick={() => navigate(`${location.pathname}/create${location.search}`)}
          >
            Создать запись
          </Button>}
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={dataSource}
        isLoading={isLoading}
        rowKey={({ id }) => id}
        onRow={record => ({
          onClick: () => navigate(`${location.pathname}/${record.id}${location.search}`)
        })}
      />
      {isModal && <DatasetForm
        query={sqlSelect(select[0], params)}
        formQuery={itemId === 'create' ? (insert?.i1 || '') : (update?.u1 || '')}
        queryId={itemId === 'create' ? queryId.insert : queryId.update}
        selectId={queryId.select}
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
            navigate(`${location.pathname.split('/').slice(0, -1).join('/')}${location.search}`)
            refetch()
          }
        }}
        onCancel={() => navigate(`${location.pathname.split('/').slice(0, -1).join('/')}${location.search}`)}
      />}
    </>
  )
}