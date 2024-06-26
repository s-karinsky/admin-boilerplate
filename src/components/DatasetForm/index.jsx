import { Modal, Form, Button, Space, Typography } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import FormField from '../FormField'
import DndModal from '../DndModal'
import { replaceQueryFields } from '../../utils/utils'

const { Text } = Typography

const usingTypes = ['date', 'time', 'memo']

export default function DatasetForm({
  query,
  formQuery,
  fields,
  queryId,
  selectId,
  parentId,
  selectionId,
  initialValues = {},
  onOk = () => {},
  onCancel = () => {}
}) {
  const [ form ] = Form.useForm()
  const iWasHere = query.trim().endsWith('pm_blocks') && selectId === '45'

  return (
    <DndModal
      onOk={() => form.submit()}
      onCancel={onCancel}
      footer={[
        <Button
          key='setting'
          onClick={() => {
            const values = form.getFieldsValue()
            if (parentId) {
              values.parent_id = parentId
            }
            if (selectionId) {
              values.parent_id = selectionId
            }
            const fullQuery = replaceQueryFields(formQuery, { values, oldValues: initialValues, fields })
            Modal.info({
              width: 800,
              title: 'Информация',
              content: (
                <Space direction='vertical'>
                  {Object.keys(values).map(field => ( 
                    <Text style={{ marginBottom: 20 }} key={field} code>
                      {field}={(initialValues[field] || '') === (values[field] || '') ? (values[field] || '""') : `${initialValues[field] || '""'} (${values[field] || '""'})`}
                    </Text>
                  ))}
                  <Text strong>Запрос выборки (id={selectId})</Text>
                  <Text style={{ marginBottom: 20 }} code>{query}</Text>
                  <Text strong>Исходный запрос действия (id={queryId})</Text>
                  <Text code>{formQuery}</Text>
                  <Text strong>Реальный запрос действия</Text>
                  <Text code>{fullQuery}</Text>
                </Space>
              )
            })
          }}
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
        {iWasHere && <div style={{ position: 'absolute', right: 40, top: 10 }}>
          Здесь был я
        </div>}
        {fields.map(field => (
          <FormField
            key={field.name}
            name={field.name}
            hidden={field.visible === 'N'}
            type={usingTypes.includes(field.type) ? field.type : undefined}
            width='100%'
            {...field.props}
          />
        ))}
      </Form>
    </DndModal>
  )
}