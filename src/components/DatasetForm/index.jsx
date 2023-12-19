import { Modal, Form, Button, Space, Typography } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import FormField from '../FormField'

const { Text } = Typography

export default function DatasetForm({
  query,
  fields,
  initialValues,
  onOk = () => {},
  onCancel = () => {}
}) {
  const [ form ] = Form.useForm()

  return (
    <Modal
      onOk={() => form.submit()}
      onCancel={onCancel}
      footer={[
        <Button
          key='setting'
          onClick={() => Modal.info({
            width: 800,
            title: 'Информация',
            content: (
              <Space direction='vertical'>
                {Object.keys(form.getFieldsValue()).map(field => (
                  <Text style={{ marginBottom: 20 }} key={field} code>
                    {field}={form.getFieldsValue()[field]}
                  </Text>
                ))}
                <Text strong>Запрос</Text>
                <Text style={{ marginBottom: 20 }} code>{query}</Text>
              </Space>
            )
          })}
        >
          <SettingOutlined />
        </Button>,
        <Button key='cancel' onClick={() => onCancel()}>
          Отмена
        </Button>,
        <Button key='ok' type='primary' onClick={() => form.submit()}>
          Сохранить
        </Button>
      ]}
      open
    >
      <Form
        layout='vertical'
        size='large'
        initialValues={initialValues}
        form={form}
        onFinish={onOk}
      >
        {fields.map(field => (
          <FormField
            key={field.name}
            name={field.name}
            label={field?.label}
          />
        ))}
      </Form>
    </Modal>
  )
}