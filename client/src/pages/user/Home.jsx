import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FB from '../../lib/fb'
import AppHeader from '../../components/AppHeader'
import Countdown from '../../components/Countdown'
import Icon from '../../components/Icon'

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='200'%3E%3Crect fill='%23007aff' width='500' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20' font-weight='bold'%3EQBIT SPORTS%3C/text%3E%3C/svg%3E"

function PollCard({ poll, uid, showToast, onVoted }) {
  const totalVotes = poll.votes ? Object.keys(poll.votes).length : 0
  const userVotedOpt = uid ? poll.votes[uid] : null

  const vote = async (key) => {
    if (userVotedOpt) return
    try {
      await FB.votePoll(poll.id, uid, key)
      showToast('Vote submitted!')
      onVoted()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  return (
    <div className="card poll-card">
      <h3 className="poll-question">{poll.question}</h3>
      {Object.entries(poll.options).map(([key, text]) => {
        const count = Object.values(poll.votes).filter(v => v === key).length
        const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0
        const mine = userVotedOpt === key
        return (
<button key={key} className={`poll-option ${mine ? 'poll-option-mine' : ''}`} onClick={() => vote(key)} disabled={!!userVotedOpt}>
              <div className="poll-option-row">
                <span>{text}{mine ? ' ' : ''}{mine && <Icon name="checkmark" size={14} />}</span>
                {userVotedOpt && <span>{pct}%</span>}
            </div>
            {userVotedOpt && (
              <div className="poll-bar"><div className="poll-bar-fill" style={{ width: pct + '%' }} /></div>
            )}
          </button>
        )
      })}
      <div className="poll-total">{totalVotes} votes</div>
    </div>
  )
}

function TournamentCard({ t, joined, onOpen }) {
  const joinedCount = t.joinedPlayers ? Object.keys(t.joinedPlayers).length : 0
  const totalTarget = t.target || 50
  return (
    <div className="tournament-card card">
      <div className="t-img-box" onClick={onOpen}>
        {t.status === 'live'
          ? <div className="t-badge t-badge-live"><span className="dot dot-success" /> Live (Open)</div>
          : <div className="t-badge t-badge-soon"><span className="dot dot-warning" /> Starts Soon</div>}
        <div className="t-map-badge">🗺 {t.map || 'Bermuda'}</div>
        <img src={t.image || FALLBACK_IMG} className="t-img" alt="Cover" />
      </div>
      <div className="t-info">
        <div className="t-title" onClick={onOpen}>{t.title}</div>
        <div className="t-pills">
          <div className="t-time-pill"><Countdown time={t.raw_time_obj} /></div>
          <div className="t-type-pill">👥 {t.type || 'Solo'}</div>
        </div>
        <div className="t-stats" onClick={onOpen}>
          <div className="t-stat-box"><span>Entry Fee</span><strong>₹{t.entry || 0}</strong></div>
          <div className="t-stat-box"><span>Prize Pool</span><strong className="prize-text">₹{t.prize || 0}</strong></div>
          <div className="t-stat-box"><span>Per Kill</span><strong>₹{t.kill || 0}</strong></div>
        </div>
        <div className="joined-players-ui" onClick={onOpen}>
          <div className="jp-avatars">
            <div className="jp-av" style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${t.id}1')` }} />
            <div className="jp-av" style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${t.id}2')` }} />
            <div className="jp-av" style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${t.id}3')` }} />
          </div>
          <div className="jp-text"><strong>{joinedCount}/{totalTarget}</strong> Players Joined <Icon name="chevronRight" size={14} /></div>
        </div>
        {joined && <div className="t-joined-flag"><Icon name="checkmark" size={14} /> You Joined</div>}
      </div>
    </div>
  )
}

// Home page (replaces user/home.html main app + home.js loadHomeTournaments / loadPolls)
export default function Home({ user, showToast }) {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [joinedIds, setJoinedIds] = useState(new Set())
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [ts, txs] = await Promise.all([FB.getTournaments(), FB.getTransactions(user.uid)])
      const ids = new Set(txs.filter(tx => tx.status === 'Success' && tx.type === 'Join Fee' && tx.tournament_id).map(tx => String(tx.tournament_id)))
      setTournaments(ts.filter(t => t.status !== 'completed'))
      setJoinedIds(ids)
      try { setPolls((await FB.getPolls()).filter(p => p.status === 'active')) } catch (e) { /* ignore */ }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  return (
    <div className="app-container">
      <AppHeader user={user} />
      <div className="page-content">
        {polls.map(poll => (
          <PollCard key={poll.id} poll={poll} uid={user.uid} showToast={showToast} onVoted={load} />
        ))}

        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : tournaments.length === 0 ? (
          <div className="empty-state">No Active Tournaments</div>
        ) : (
          tournaments.map(t => (
            <TournamentCard key={t.id} t={t} joined={joinedIds.has(String(t.id))} onOpen={() => navigate(`/tournaments/${t.id}`)} />
          ))
        )}
      </div>
    </div>
  )
}
