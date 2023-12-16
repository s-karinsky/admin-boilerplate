import { useNavigate } from 'react-router-dom'
import { Table, Tag, Row, Button } from 'antd'
import { CheckOutlined, PlusCircleFilled } from '@ant-design/icons'
import { getColumnSearch } from '../../utils/components'
import { useUsers } from '../../utils/hooks'
import { USER_ROLES, USER_ROLES_COLOR } from '../../consts'

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (name, { family }) => [name, family].filter(item => item).join(' ') || 'No name',
    ...getColumnSearch('name', { getData: record => ([record.name, record.family].join(' ')) })
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
    render: email => email || 'No email',
    ...getColumnSearch('email')
  },
  {
    title: 'Role',
    dataIndex: 'id_role',
    key: 'id_role',
    render: text => (<Tag color={USER_ROLES_COLOR[text]}>{USER_ROLES[text]}</Tag>),
    filters: Object.keys(USER_ROLES).map(id => ({
      text: USER_ROLES[id],
      value: id
    })),
    onFilter: (value, record) => record.id_role === value
  },
  {
    title: 'Checked seller',
    dataIndex: 'id_verification_status',
    key: 'id_verification_status',
    render: (state, record) => record.id_role === '2' && state === '2' ? <CheckOutlined style={{ color: '#09d934' }} /> : ''
  }
]

export default function PageUsers() {
  const navigate = useNavigate()
  const users = useUsers()

  return (
    <>
      <Row
        style={{
          borderBottom: '1px solid #ccc',
          padding: '10px 20px',
        }}
      >
        <Button
          icon={<PlusCircleFilled />}
          style={{ marginRight: '10px' }}
          type='primary'
          onClick={() => navigate('/users/create')}
        >
          Создать пользователя
        </Button>
      </Row>
      <Table
        columns={columns}
        dataSource={users.data}
        loading={users.isLoading}
        rowKey={({ id_user }) => id_user}
        onRow={record => ({
          onClick: (e) => {
            if (e.detail === 2) {
              navigate(`/users/${record.id_user}`)
            }
          }
        })}
      />
    </>
  )
}