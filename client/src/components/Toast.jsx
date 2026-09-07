import React from 'react'

export default function Toast({ message, type = 'success' }) {
  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </span>
      {message}
    </div>
  )
}
