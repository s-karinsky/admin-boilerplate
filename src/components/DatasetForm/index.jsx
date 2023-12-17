import { Modal, Form } from 'antd'
import { useNavigate } from 'react-router-dom'
import FormField from '../FormField'

export default function DatasetForm({
  fields,
  initialValues,
  onFinish = () => {}
}) {
  const navigate = useNavigate()
  const [ form ] = Form.useForm()

  return (
    <Modal
      onOk={() => form.submit()}
      onCancel={() => navigate('/form')}
      open
    >
      <Form
        layout='vertical'
        size='large'
        initialValues={initialValues}
        form={form}
        onFinish={onFinish}
      >
        {Object.keys(fields).map(field => (
          <FormField
            key={field}
            name={field}
            label={fields[field]?.label}
          />
        ))}
      </Form>
    </Modal>
  )
}