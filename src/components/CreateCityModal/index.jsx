import { Modal, Form, Button, Select, Input } from 'antd'
import axios from '../../utils/axios'
import { sqlInsert } from '../../utils/sql'
import { getLastId } from '../../utils/api'

export default function CreateCityModal({
  onOk = () => {},
  onClose = () => {},
  countries,
  initialValues,
  isOpen
}) {
  const [ form ] = Form.useForm()

  return isOpen ?
    <Modal
      title='Добавить город'
      onOk={() => {
        form.submit()
      }}
      onCancel={onClose}
      open
    >
      <Form
        initialValues={initialValues}
        layout='vertical'
        size='large'
        onFinish={async (values) => {
          await axios.postWithAuth('/query/insert', {
            sql: sqlInsert('city', values)
          })
          const id = await getLastId('city', 'id_city')
          onOk({ id, ...values })
          onClose()
        }}
        form={form}
        footer={[
          <Button
            key='1'
            onClick={() => onClose()}
            danger
          >
            Отмена
          </Button>,
          <Button
            key='2'
            type='primary'
            style={{ backgroundColor: 'rgb(0, 150, 80)' }}
            onClick={() => {
              form.submit()
            }}
          >
            Сохранить
          </Button>,
        ]}
      >
        <Form.Item
          name='country'
          label='Страна'
        >
          <Select
            options={countries}
          />
        </Form.Item>
        <Form.Item
          name='name_ru'
          label='Город'
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal> :
  null
}