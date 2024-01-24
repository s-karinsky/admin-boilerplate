import { Form, Input, InputNumber, DatePicker, Select } from 'antd'
import { MaskedInput } from 'antd-mask-input'

export default function FormField({
  label,
  name,
  type,
  isEdit = true,
  text,
  rules,
  width,
  labelType,
  mask,
  ...rest
}) {
  let child = null

  if (width) {
    rest = {
      style: {
        width,
        ...rest?.style
      },
      ...rest
    }
  }

  switch (type) {
    case 'date':
      child = isEdit ?
        <DatePicker format='DD.MM.YYYY' placeholder='Выберите дату' {...rest} /> :
        <div style={{ fontSize: 16, fontWeight: 'normal', ...rest.style }}>
          {text}
        </div>
      break

    case 'select':
      child = isEdit ?
        <Select
          {...rest}
        /> :
        <div style={{ fontSize: 16, fontWeight: 'normal', ...rest.style }}>
          {text}
        </div>
      break

    case 'number':
      child = <InputNumber
        {...rest}
        decimalSeparator=','
        bordered={isEdit}
        readOnly={!isEdit}
      />
      break

    case 'textarea':
      child = isEdit ?
        <Input.TextArea {...rest} autoSize /> :
        <div style={{ fontSize: 16, fontWeight: 'normal', ...rest.style }}>
          {text}
        </div>
      break
  
    default:
      child = mask ?
        <MaskedInput
          {...rest}
          bordered={isEdit}
          readOnly={!isEdit}
          mask={mask}
        />
        : <Input
          {...rest}
          bordered={isEdit}
          readOnly={!isEdit}
        />
      break
  }

  if (labelType === 'sum') {
    label = <><sup>∑</sup>&nbsp;{label}</>
  } else if (labelType === 'calc') {
    label = <><sup>ƒ</sup>&nbsp;{label}</>
  }

  return (
    <Form.Item
      label={label}
      name={name}
      style={{ fontWeight: 'bold', width }}
      rules={isEdit ? rules : undefined}
    >
      {child}
    </Form.Item>
  )
}