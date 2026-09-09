import React from 'react'
import Icon from './Icon'

export default function Toast({ message, type = 'success' }) {
  const iconName = type === 'success' ? 'checkmark' : type === 'error' ? 'close' : 'info'
  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">
        <Icon name={iconName} size={18} />
      </span>
      {message}
    </div>
  )
}
