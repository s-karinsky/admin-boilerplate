import { Modal, Space, Typography } from 'antd'

const { Text } = Typography

export default function SqlError({
  message,
  query
}) {
  return (
    <>
      {!!query && <Space direction='vertical' style={{ marginBottom: 20 }}>
        <Text strong>Запрос</Text>
        <Text code>{query}</Text>
      </Space>}
      {!!message && <Space direction='vertical'>
        <Text strong>Ошибка</Text>
        <Text code>{message}</Text>
      </Space>}
    </>
  )
}

export const ModalSqlError = ({ title = 'Произошла ошибка', width = 600, message, query }) => 
  Modal.error({ title, width, content: <SqlError message={message} query={query} /> })