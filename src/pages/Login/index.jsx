import { useState } from 'react'
import { Col, Row, Button, Form, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import { login } from '../../utils/api'

export default function PageLogin() {
  const [ isLoading, setIsLoading ] = useState()
  const navigate = useNavigate()

  return (
    <Row style={{ height: '100vh' }} justify='center' align='middle'>
      <Col span={8}>
        <Form
          name='basic'
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600, textAlign: 'left' }}
          initialValues={{ remember: true }}
          onFinish={values => {
            setIsLoading(true)
            login(values).then(role => {
              setIsLoading(false)
              if (role) navigate(role === '4' ? '/users' : '/tickets')
            })
          }}
          autoComplete='off'
        >
          <Form.Item
            label='Email'
            name='login'
            rules={[{ required: true, message: 'Please input your email!' }]}
          >
            <Input type='email' />
          </Form.Item>

          <Form.Item
            label='Password'
            name='password'
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button
              type='primary'
              htmlType='submit'
              loading={isLoading}
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  )
}