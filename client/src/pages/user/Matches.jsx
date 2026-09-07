import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FB from '../../lib/fb'
import AppHeader from '../../components/AppHeader'
import Countdown from '../../components/Countdown'

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23007aff' width='150' height='150'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3EQBIT%3C/text%3E%3C/svg%3E"

// My Matches page (replaces user/matches.html + matches.js)
export default function Matches({ user, showToast }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('upcoming')
  const [upcoming, setUpcoming] = useState([])
  const [completed, setCompleted] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [ts, txs] = await Promise.all([FB.getTournaments(), FB.getTransactions(user.uid)])
        const joinedIds = new Set(
          txs.filter(tx => tx.status === 'Success' && tx.type === 'Join Fee' && tx.tournament_id).map(tx => String(tx.tournament_id))
        )
        const up = []
        const done = []
        ts.forEach(t => {
          if (t.status !== 'completed') {
            if (joinedIds.has(String(t.id)) || t.status === 'soon') up.push({ t, joined: joinedIds.has(String(t.id)) })
          } else if (joinedIds.has(String(t.id))) {
            done.push(t)
          }
        })
        setUpcoming(up)
        setCompleted(done)
      } catch (e) {
        showToast('Failed to load matches', 'error')
      }
      setLoading(false)
    })()
  }, []) // eslint-disable-line

  const MatchCard = ({ t, badge, badgeClass, sub }) => (
    <div className="premium-match-card card" onClick={() => navigate(`/tournaments/${t.id}`)}>
      <img src={t.image || FALLBACK_IMG} className="pmc-img" alt="" />
      <div className="pmc-info">
        <h4>{t.title}</h4>
        <p><Countdown time={t.raw_time_obj} /> <span className="t-type-pill" style={{ marginLeft: 6 }}>{t.type || 'Solo'}</span></p>
        <div className={`pmc-badge ${badgeClass}`}>{badge}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>}
      </div>
    </div>
  )

  return (
    <div className="app-container">
      <AppHeader user={user} />
      <div className="page-content">
        <div className="ios-segment">
          <button className={`segment-btn ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming</button>
          <button className={`segment-btn ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>Completed</button>
        </div>

        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : tab === 'upcoming' ? (
          upcoming.length === 0
            ? <div className="empty-state">No Upcoming Matches</div>
            : upcoming.map(({ t, joined }) => (
              <MatchCard key={t.id} t={t}
                badge={joined ? 'Joined Successfully' : 'Starts Soon'}
                badgeClass={joined ? 'badge-joined' : 'badge-soon'} />
            ))
        ) : (
          completed.length === 0
            ? <div className="empty-state">No Completed Matches</div>
            : completed.map(t => (
              <MatchCard key={t.id} t={t} badge="View Result" badgeClass="badge-result" sub="Completed" />
            ))
        )}
      </div>
    </div>
  )
}
