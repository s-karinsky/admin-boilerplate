import { useMemo, useState } from 'react'
import {
  BarcodeOutlined,
  UserOutlined,
  DownOutlined,
  UnorderedListOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  FileTextOutlined,
  TranslationOutlined,
  MailOutlined,
  CarOutlined,
  NotificationOutlined,
} from '@ant-design/icons'
import Cookies from 'universal-cookie'
import { Avatar, Button, Dropdown, Menu, Space, Layout, Row, Col } from 'antd'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
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
  translations: getItem(
    <Link to='/translations'>Translations</Link>,
    'translations',
    <TranslationOutlined />
  ),
  content: getItem('Content', 'content', <FileTextOutlined />, [
    getItem(<Link to='/content/about-us'>About us</Link>, 'about-us'),
    getItem(<Link to='/content/faq'>FAQ</Link>, 'faq'),
    getItem(<Link to='/content/news'>News</Link>, 'news'),
    getItem(<Link to='/content/corporate'>Corporate</Link>, 'corporate'),
    getItem(
      <Link to='/content/privacy-policy'>Privacy policy</Link>,
      'privacy-policy'
    ),
    getItem(
      <Link to='/content/become-a-partner'>Become a partner</Link>,
      'become-a-partner'
    ),
  ]),
  data: getItem('Data', 'data', <UnorderedListOutlined />, [
    getItem(<Link to='/matches'>Matches</Link>, 'matches'),
    getItem(<Link to='/teams'>Teams</Link>, 'teams'),
    getItem(<Link to='/stadiums'>Stadiums</Link>, 'stadiums'),
    getItem(<Link to='/tournaments'>Tournaments</Link>, 'tournaments'),
  ]),
  templates: getItem('E-mail templates', 'templates', <MailOutlined />, [
    getItem(<Link to='/templates/signup'>Signup</Link>, 'signup'),
    getItem(
      <Link to='/templates/booking-in-cart'>
        Booking tickets in cart
      </Link>,
      'booking-in-cart'
    ),
    getItem(
      <Link to='/templates/successful-payment'>Successful payment</Link>,
      'successful-payment'
    ),
    getItem(
      <Link to='/templates/checking-ticket'>
        Does the ticket work or not
      </Link>,
      'checking-ticket'
    ),
    getItem(<Link to='/templates/feedback'>Feedback</Link>, 'feedback'),
    getItem(
      <Link to='/templates/restore-password'>Restore password</Link>,
      'restore-password'
    ),
    getItem(
      <Link to='/templates/tickets-are-in-stock'>
        Tickets are in stock
      </Link>,
      'tickets-are-in-stock'
    ),
  ]),
  users: getItem(<Link to='/users'>Users</Link>, 'users', <UserOutlined />),
  tickets: getItem(
    <Link to='/tickets'>Tickets</Link>,
    'tickets',
    <BarcodeOutlined />
  ),
  notifications: getItem(
    <Link to='/notifications'>Notifications</Link>,
    'notifications',
    <NotificationOutlined />
  ),
  sendings: getItem(
    <Link to='/sendings'>Sendings</Link>,
    'sendings',
    <CarOutlined />
  ),
}

export default function PageLayout({ user = {} }) {
  const [ collapsed, setCollapsed ] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const items = useMemo(() => {
    if (user.u_role === '4') {
      return [
        MENU_ITEMS.users
      ]
    } else if (user.u_role === '2') {
      return [
        
      ]
    }
  }, [user.u_role])

  const toggleCollapsed = () => setCollapsed(!collapsed)

  const path = location.pathname.split('/')[1]

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
            selectedKeys={[path]}
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
