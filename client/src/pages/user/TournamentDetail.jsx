import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Modal } from '../../components/Card'
import FB from '../../lib/fb'
import AppHeader from '../../components/AppHeader'
import Countdown from '../../components/Countdown'
import Icon from '../../components/Icon'

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='200'%3E%3Crect fill='%23007aff' width='500' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20' font-weight='bold'%3EQBIT SPORTS%3C/text%3E%3C/svg%3E"

// Full-screen tournament detail page (replaces the HTML app's
// #tournament-detail-page slide-in + home.js openTournamentDetail / join flow)
export default function TournamentDetail({ user, showToast, onUser }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showPlayers, setShowPlayers] = useState(false)
  const [ffUid, setFfUid] = useState('')
  const [ffName, setFfName] = useState('')
  const [joining, setJoining] = useState(false)
  const [balance, setBalance] = useState(user.balance || 0)


  const load = async () => {
    try {
      const [ts, txs] = await Promise.all([FB.getTournaments(), FB.getTransactions(user.uid)])
      const t = ts.find(x => x.id === id)
      setData(t || null)
      setJoined(txs.some(tx => tx.status === 'Success' && tx.type === 'Join Fee' && String(tx.tournament_id) === String(id)))
      const me = await FB.getUser(user.uid)
      if (me) setBalance(me.balance || 0)
    } catch (e) {
      showToast('Failed to load tournament', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line

  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied!')).catch(() => showToast('Copy failed', 'error'))
  }

  const initiateJoin = () => {
    if (balance < Number(data.entry || 0)) {
      showToast('Insufficient Balance!', 'error')
      navigate('/wallet')
      return
    }
    setFfUid(''); setFfName('')
    setShowJoin(true)
  }

  const confirmJoin = async () => {
    if (!ffUid || !ffName) { showToast('Enter FF Details!', 'error'); return }
    setJoining(true)
    try {
      const res = await FB.joinTournament(id, user.uid, ffName, ffUid)
      setBalance(res.balance)
      showToast('Joined Tournament Successfully!')
      setShowJoin(false)
      if (onUser) {
        const fresh = await FB.getUser(user.uid)
        if (fresh) onUser(fresh)
      }
      load()
    } catch (e) {
      showToast(e.message, 'error')
    }
    setJoining(false)
  }

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /><p>Loading...</p></div>
  }
  if (!data) {
    return (
      <div className="app-container">
        <AppHeader user={user} />
        <div className="empty-state"><div className="empty-state-icon">❌</div>Tournament not found</div>
      </div>
    )
  }

  const joinedCount = data.joinedPlayers ? Object.keys(data.joinedPlayers).length : 0
  const totalTarget = data.target || 50
  const players = data.joinedPlayers ? Object.entries(data.joinedPlayers).map(([uid, v]) => ({ uid, ...v })) : []


  return (
    <div className="app-container">
      <AppHeader user={user} />
      <div className="page-content">
        <div className="detail-topbar">
          <button className="back-btn" onClick={() => navigate(-1)}><Icon name="back" size={20} /></button>
          <h2 className="detail-title">{data.title || 'Tournament'}</h2>
        </div>

        <div className="detail-img-wrap">
          <img src={data.image || FALLBACK_IMG} className="detail-img" alt="Cover" />
        </div>

        <div className="t-stats">
          <div className="t-stat-box"><span>Entry Fee</span><strong>₹{data.entry || 0}</strong></div>
          <div className="t-stat-box"><span>Prize Pool</span><strong className="prize-text">₹{data.prize || 0}</strong></div>
          <div className="t-stat-box"><span>Per Kill</span><strong>₹{data.kill || 0}</strong></div>
        </div>

        <div className="t-pills">
          <div className="t-time-pill"><Countdown time={data.raw_time_obj} /></div>
          <div className="t-type-pill">👥 {data.type || 'Solo'} • {data.map || 'Bermuda'}</div>
        </div>

        <div className="joined-players-ui" onClick={() => setShowPlayers(true)}>
          <div className="jp-avatars">
            <div className="jp-av" style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}1')` }} />
            <div className="jp-av" style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}2')` }} />
            <div className="jp-av" style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}3')` }} />
          </div>
          <div className="jp-text"><strong>{joinedCount}/{totalTarget}</strong> Players Joined <Icon name="chevronRight" size={14} /></div>
        </div>

        {joined && data.showRoom && (
          <div className="fp-box fp-box-success">
            <h3><Icon name="key" size={18} /> Room Details</h3>
            <div className="fp-row"><span>Room ID:</span><strong>{data.room_id || 'N/A'}</strong>
              <button className="copy-btn" onClick={() => copyText(data.room_id)}>Copy</button></div>
            <div className="fp-row"><span>Password:</span><strong>{data.room_pass || 'N/A'}</strong>
              <button className="copy-btn" onClick={() => copyText(data.room_pass)}>Copy</button></div>
          </div>
        )}
        {joined && !data.showRoom && (
          <div className="fp-box fp-box-warning">
            <h3><Icon name="lock" size={18} /> Room Details Hidden</h3>
            <p>Admin will reveal before the match starts.</p>
          </div>
        )}

        <div className="fp-box">
          <h3><Icon name="clipboard" size={18} /> Rules</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{data.rules || 'Play fair. No hacks.'}</p>
        </div>

        {joined ? (
          <button className="btn btn-primary btn-joined" disabled><Icon name="checkmark" size={16} /> Already Joined</button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={data.status === 'soon'}
            onClick={initiateJoin}
          >
            {data.status === 'soon' ? 'Match Starts Soon' : `Join Tournament (₹${data.entry || 0})`}
          </button>
        )}
      </div>


      {/* Join form modal */}
      <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Join Tournament">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Enter your Free Fire details carefully.
        </p>
        <div className="input-group">
          <label className="input-label">FreeFire UID (Numbers Only)</label>
          <input className="input-field" type="number" value={ffUid} onChange={e => setFfUid(e.target.value)} placeholder="FF UID" />
        </div>
        <div className="input-group">
          <label className="input-label">FreeFire In-Game Name</label>
          <input className="input-field" value={ffName} onChange={e => setFfName(e.target.value)} placeholder="In-Game Name" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} onClick={confirmJoin} disabled={joining}>
          {joining ? 'Joining...' : `Pay & Join (₹${data.entry || 0})`}
        </button>
      </Modal>

      {/* Joined players modal */}
      <Modal isOpen={showPlayers} onClose={() => setShowPlayers(false)} title="Players Joined">
        {players.length === 0 ? (
          <div className="empty-state">No players joined yet.</div>
        ) : (
          players.map((p, i) => (
            <div className="player-list-item" key={p.uid}>
              <div className="pl-num">#{i + 1}</div>
              <div className="pl-av" style={{ backgroundImage: `url('${p.avatar || FALLBACK_IMG}')` }} />
              <div className="pl-info">
                <h5>{p.ffName}</h5>
                <p>UID: {p.ffUid} | +91 {p.uid === user.uid ? (user.phone || 'You') : ''}</p>
              </div>
            </div>
          ))
        )}
      </Modal>
    </div>
  )
}

