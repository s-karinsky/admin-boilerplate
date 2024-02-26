import { useMemo, useState } from 'react'
import {
  UserOutlined,
  DownOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  FormOutlined,
  PlusSquareOutlined
} from '@ant-design/icons'
import Cookies from 'universal-cookie'
import { Avatar, Button, Dropdown, Menu, Space, Layout, Row, Col } from 'antd'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useQueries } from 'react-query'
import { getSelections } from '../../utils/api'
import styles from './styles.module.scss'

const { Header, Sider, Content } = Layout

function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  }
}

const MENU_ITEMS = {
  maksense: getItem(<Link to='/makesense'>Makesense</Link>, 'makesense'),
  users: getItem(<Link to='/users'>Users</Link>, 'users', <UserOutlined />),
}

const groups = [{
  name: 'metaadm',
  label: 'Генераторы',
  icon: <PlusSquareOutlined />
}, {
  name: 'metabase',
  label: 'Формы',
  icon: <FormOutlined />
}]

export default function PageLayout({ user = {} }) {
  const [ collapsed, setCollapsed ] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const result = useQueries(
    groups.map(item => ({
      queryKey: [`menu-${item.name}`],
      queryFn: getSelections(item.name)
    }))
  )

  const items = useMemo(() => {
    if (user.u_role !== '4') return []
    const items = [MENU_ITEMS.maksense, MENU_ITEMS.users]

    result.filter(nav => nav.isSuccess).forEach((nav, i) => {
      const group = groups[i]
      const menuItem = getItem(
        group.label,
        group.name,
        group.icon,
        nav.data.map(item => getItem(<Link to={`/${group.name}/${item.id}`}>{item.label}</Link>, `${group.name}-${item.id}`))
      )
      items.push(menuItem)
    })

    return items
  }, [user.u_role, result])

  const toggleCollapsed = () => setCollapsed(!collapsed)

  const userItems = useMemo(
    () => [
      {
        label: (
          <a
            onClick={(e) => {
              e.preventDefault()
              const cookies = new Cookies()
              cookies.remove('token')
              cookies.remove('u_hash')
              navigate('/login')
            }}
          >
            Logout
          </a>
        ),
        key: '0',
      },
    ],
    [navigate]
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header>
        <Row justify='space-between'>
          <Col style={{ marginLeft: -30 }}>
            <Button
              type='primary'
              onClick={toggleCollapsed}
              style={{ marginBottom: 16 }}
            >
              {collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )}
            </Button>
          </Col>
          <Col>
            <Avatar src={user.u_photo} />
            <Dropdown
              menu={{ items: userItems }}
              trigger={['click']}
            >
              <a
                onClick={(e) => e.preventDefault()}
                className={styles.headerUser}
              >
                <Space>
                  {user.u_name}
                  <DownOutlined
                    style={{ fontSize: '10px' }}
                  />
                </Space>
              </a>
            </Dropdown>
          </Col>
        </Row>
      </Header>
      <Layout>
        <Sider collapsed={collapsed}>
          <Menu
            theme='dark'
            items={items}
            mode='inline'
          />
        </Sider>
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
