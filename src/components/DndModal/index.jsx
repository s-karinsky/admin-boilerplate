import { useState, useCallback } from 'react'
import { Modal } from 'antd'
import styles from './styles.module.scss'

export default function DndModal({ title, ...props }) {
  const [ pos, setPos ] = useState([0, 0])

  const handleMouseDown = useCallback(event => {
    const initialX = event.clientX - pos[0]
    const initialY = event.clientY - pos[1]

    const handleMouseMove = e => {
      const currentX = e.clientX
      const currentY = e.clientY
      const pos = [ currentX - initialX, currentY - initialY ]
      setPos(pos)
    }

    const handleMouseUp = e => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, pos)

  return <Modal
    style={{
      left: pos[0],
      marginTop: pos[1]
    }}
    title={
      <div className={styles.title}>
        <div className={styles.titleDnd} onMouseDown={handleMouseDown} />
        {title}
      </div>
    }
    {...props}  
  />
}