export const numberRange = ({ min, max }, message = `Введите число ${min ? `от ${min} ` : ''}${max ? `до ${max}` : ''}`) => (
  [
    {
      type: 'number',
      min,
      max,
      message
    }
  ]
)

export const emailRule = message => ({
  pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/i,
  message
})