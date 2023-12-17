import { useEffect } from 'react'
import { LoadingOutlined } from '@ant-design/icons'
import { Row } from 'antd'
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'
import PageDataset from './pages/Dataset'
import PageLogin from './pages/Login'
import PageUsers from './pages/Users'
import PageUser from './pages/User'
import Layout from './components/Layout'
import { useAuthorization } from './utils/hooks'
import './App.css'

const cookies = new Cookies()

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  const token = cookies.get('token')
  const u_hash = cookies.get('u_hash')
  const user = useAuthorization({ token, u_hash })

  useEffect(() => {
    if (user.isLoading) return
    const role = user.data?.u_role
    if (!role) {
      navigate('/login', { replace: true })
    } else if (isLoginPage) {
      navigate(role === '4' ? '/users' : '/tickets', { replace: true })
    }
  }, [user.isLoading, user.data?.u_role, isLoginPage])

  if ((user.isLoading || !user.data?.authorized) && !isLoginPage) {
    return (
      <Row style={{ height: '100vh' }} justify='center' align='middle'>
        <LoadingOutlined style={{ fontSize: '64px' }} />
      </Row>
    )
  }

  return (
    <div className='App'>
      <Routes>
        <Route path='/' element={<Layout user={user.data} />}>
          <Route path='/users' element={<PageUsers />} />
          <Route path='/users/:id' element={<PageUser />} />
          <Route path='/selections/:selectionId/:itemId?' element={<PageDataset />} />
        </Route>
        <Route path='/login' element={<PageLogin />} />
      </Routes>
    </div>
  )
}

export default App
