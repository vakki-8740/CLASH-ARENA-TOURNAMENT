import React, { useEffect, useState } from 'react'
import FB from '../../lib/fb'
import AppHeader from '../../components/AppHeader'
import Icon from '../../components/Icon'

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23007aff' width='150' height='150'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3EQBIT%3C/text%3E%3C/svg%3E"

function formatOnlyTime(dateString) {
  if (!dateString) return 'TBA'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return 'TBA'
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// Leaderboard / results page (replaces user/rank.html + rank.js)
export default function Rank({ user, showToast }) {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    FB.getTournaments()
      .then(ts => setTournaments(ts.filter(t => t.status === 'completed')))
      .catch(() => showToast('Failed to load results', 'error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  return (
    <div className="app-container">
      <AppHeader user={user} />
      <div className="page-content">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : tournaments.length === 0 ? (
          <div className="empty-state">No Results Yet</div>
        ) : tournaments.map(t => (
          <div className="rc-card card" key={t.id}>
            <div className="rc-header">
              <img src={t.image || FALLBACK_IMG} className="rc-img" alt="" />
              <div className="rc-info">
                <h4>{t.title}</h4>
                <div className="rc-map">🗺 {t.map} <span className="t-type-pill">{t.type || 'Solo'}</span></div>
                <div className="rc-time">🕐 {formatOnlyTime(t.raw_time_obj)}</div>
              </div>
              <div className="rc-status">Completed</div>
            </div>
            <div className="rc-stats">
              <div><span>Entry</span><strong>₹{t.entry || 0}</strong></div>
              <div><span>Prize Pool</span><strong style={{ color: 'var(--green)' }}>₹{t.prize || 0}</strong></div>
              <div><span>Per Kill</span><strong style={{ color: 'var(--blue)' }}>₹{t.kill || 0}</strong></div>
            </div>
            {t.winner_name && t.winner_uid ? (
              <div className="rc-winner">
                <div className="rcw-crown"><Icon name="crown" size={24} /></div>
                <div className="rcw-details">
                  <p>#1 Winner</p>
                  <h3>{t.winner_name}</h3>
                  <span>UID: {t.winner_uid}</span>
                </div>
              </div>
            ) : (
              <div className="no-result-text">Rank details updating soon...</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
