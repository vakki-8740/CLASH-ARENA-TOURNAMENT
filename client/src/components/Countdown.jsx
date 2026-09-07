import React, { useEffect, useState } from 'react'

// Live countdown timer, same behaviour as the HTML app's .dynamic-timer
// data-time can be an ISO string or a "YYYY-MM-DD HH:mm" style value
export default function Countdown({ time, className = '' }) {
  const calc = () => {
    if (!time) return { text: 'TBA', done: true }
    const target = new Date(time).getTime()
    if (isNaN(target)) return { text: 'TBA', done: true }
    const diff = target - Date.now()
    if (diff <= 0) return { text: 'Started', done: true }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return { text: `${h}h ${m}m ${s}s`, done: false }
  }

  const [state, setState] = useState(calc)

  useEffect(() => {
    setState(calc())
    const t = setInterval(() => setState(calc()), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time])

  return (
    <span className={`countdown ${state.done ? 'countdown-done' : ''} ${className}`}>
      {state.text}
    </span>
  )
}
