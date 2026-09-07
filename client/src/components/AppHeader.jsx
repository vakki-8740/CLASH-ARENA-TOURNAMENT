import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FB from '../lib/fb'

// Shared top header: logo, app name (from settings), wallet balance, avatar
export default function AppHeader({ user, balance }) {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({})
  const [bal, setBal] = useState(balance ?? 0)

  useEffect(() => {
    FB.getSettings().then(setSettings).catch(() => {})
  }, [])

  useEffect(() => { setBal(balance ?? 0) }, [balance])

  useEffect(() => {
    const t = setInterval(async () => {
      const uid = FB.getCurrentUid()
      if (!uid) return
      try {
        const u = await FB.getUser(uid)
        if (u) setBal(u.balance || 0)
      } catch (e) { /* ignore */ }
    }, 15000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="app-header">
      <div className="app-header-left" onClick={() => navigate('/home')}>
        <div className="app-header-logo">
          {settings.appLogo
            ? <img src={settings.appLogo} alt="" />
            : <span>{(settings.appName || 'QBIT SPORTS').slice(0, 2).toUpperCase()}</span>}
        </div>
        <div>
          <div className="app-header-name">{settings.appName || 'QBIT SPORTS'}</div>
          <div className="app-header-sub">Play & Win</div>
        </div>
      </div>
      <div className="app-header-right">
        <div className="wallet-badge" onClick={() => navigate('/wallet')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a2 2 0 100-4 2 2 0 000 4z"/></svg>
          ₹{bal}
        </div>
        <div
          className="header-avatar"
          style={user?.avatar ? { backgroundImage: `url('${user.avatar}')` } : {}}
          onClick={() => navigate('/profile')}
        >
          {!user?.avatar && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          )}
        </div>
      </div>
    </div>
  )
}
