import React, { useEffect, useState } from 'react'
import AppHeader from '../../components/AppHeader'
import FB from '../../lib/fb'
import Icon from '../../components/Icon'

// Settings page (replaces user/settings.html + settings.js)
export default function Settings({ user, onLogout, showToast }) {
  const [dark, setDark] = useState(localStorage.getItem('arena_theme') !== 'light')
  const [about, setAbout] = useState(false)
  const [privacy, setPrivacy] = useState(false)

  // Theme is dark by default in this design; toggle stores preference
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('arena_theme', dark ? 'dark' : 'light')
  }, [dark])

  const shareApp = () => {
    const url = window.location.origin
    if (navigator.share) {
      navigator.share({ title: 'QBIT SPORTS', text: 'Check out QBIT SPORTS - Play & Win tournaments!', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard!')).catch(() => showToast('Share not supported', 'error'))
    }
  }

  const clearCache = () => {
    if (window.confirm('Clear all app data and reload?')) {
      localStorage.removeItem('arena_uid')
      localStorage.removeItem('arena_theme')
      window.location.reload()
    }
  }

  return (
    <div className="app-container">
      <AppHeader user={user} />
      <div className="main-content">
        <h2 className="page-title">Settings</h2>

        <div className="settings-list card">
          <div className="setting-item">
            <span><Icon name="moon" size={16} /> Dark Mode</span>
            <label className="switch">
              <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
          <div className="setting-item" onClick={shareApp}>
            <span><Icon name="share" size={16} /> Share App</span><i className="chev"><Icon name="chevronRight" size={14} /></i>
          </div>
          <div className="setting-item" onClick={() => showToast('Rate us on the Play Store!')}>
            <span><Icon name="star" size={16} /> Rate App</span><i className="chev"><Icon name="chevronRight" size={14} /></i>
          </div>
          <div className="setting-item" onClick={() => setAbout(true)}>
            <span><Icon name="info" size={16} /> About</span><i className="chev"><Icon name="chevronRight" size={14} /></i>
          </div>
          <div className="setting-item" onClick={() => setPrivacy(true)}>
            <span><Icon name="lock" size={16} /> Privacy Policy</span><i className="chev"><Icon name="chevronRight" size={14} /></i>
          </div>
          <div className="setting-item" onClick={clearCache}>
            <span><Icon name="trash" size={16} /> Clear Cache</span><i className="chev"><Icon name="chevronRight" size={14} /></i>
          </div>
        </div>

        <button className="btn btn-danger" style={{ width: '100%', marginTop: 16 }} onClick={() => {
          if (window.confirm('Are you sure you want to logout?')) onLogout()
        }}>Logout</button>
      </div>

      {about && (
        <div className="modal-overlay" onClick={() => setAbout(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div className="about-logo">QS</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 5 }}>QBIT SPORTS</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              QBIT SPORTS is a competitive gaming tournament platform where you can play Free Fire tournaments, win prizes, and climb the leaderboard.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setAbout(false)}>Close</button>
          </div>
        </div>
      )}

      {privacy && (
        <div className="modal-overlay" onClick={() => setPrivacy(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 15 }}>Privacy Policy</h2>
            <p className="privacy-p"><strong>Data Collection:</strong> We collect your name, phone number, and Free Fire gaming details for tournament management.</p>
            <p className="privacy-p"><strong>Data Usage:</strong> Your data is used solely for tournament participation, payments, and account management.</p>
            <p className="privacy-p"><strong>Data Security:</strong> All data is stored securely using Firebase (Google Cloud). We do not sell or share your data with third parties.</p>
            <p className="privacy-p"><strong>Contact:</strong> For any privacy concerns, reach out via Telegram or Help & Support.</p>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => setPrivacy(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
