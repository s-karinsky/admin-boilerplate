import { Modal, Form } from 'antd'
import FormField from '../FormField'

export default function DatasetForm({
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
      open
    >
      <Form
        layout='vertical'
        size='large'
        initialValues={initialValues}
        form={form}
        onFinish={onOk}
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