import React, { useEffect, useState } from 'react'
import FB from '../../lib/fb'
import AdminHeader from '../../components/AdminHeader'
import { Modal } from '../../components/Card'

// Admin Matches (replaces admin.html matches section + admin.js player/result management)
// - View joined players of each tournament
// - Set winner + credit Win amount to a player
export default function AdminMatches({ showToast }) {
  const [tournaments, setTournaments] = useState([])
  const [selected, setSelected] = useState(null)   // tournament
  const [credit, setCredit] = useState({ uid: '', name: '', amount: '' })
  const [saving, setSaving] = useState(false)

  const load = () => FB.getTournaments().then(setTournaments).catch(() => showToast('Load failed', 'error'))
  useEffect(() => { load() }, []) // eslint-disable-line

  const players = selected && selected.joinedPlayers
    ? Object.entries(selected.joinedPlayers).map(([uid, v]) => ({ uid, ...v }))
    : []

  const openPlayers = (t) => setSelected(t)

  const doCredit = async () => {
    const amt = Number(credit.amount)
    if (!credit.uid || isNaN(amt) || amt <= 0) { showToast('Select player + valid amount', 'error'); return }
    setSaving(true)
    try {
      await FB.addWin(credit.uid, amt, selected.id)
      showToast('Win credited: ₹' + amt)
      setCredit({ uid: '', name: '', amount: '' })
      load()
      const fresh = await FB.getTournaments()
      setSelected(fresh.find(t => t.id === selected.id) || null)
    } catch (e) { showToast('Error: ' + e.message, 'error') }
    setSaving(false)
  }

  const markCompleted = async () => {
    if (!window.confirm('Mark "' + selected.title + '" as completed?')) return
    setSaving(true)
    try {
      await FB.updateTournament(selected.id, { ...selected, status: 'completed' })
      showToast('Marked completed')
      load()
      const fresh = await FB.getTournaments()
      setSelected(fresh.find(t => t.id === selected.id) || null)
    } catch (e) { showToast('Error', 'error') }
    setSaving(false)
  }

  const active = tournaments.filter(t => t.status !== 'completed')

  return (
    <div className="admin-page">
      <AdminHeader title="Matches" />
      <div className="admin-body">
        <h3 className="admin-section-title">Active / Upcoming Tournaments</h3>
        {active.map(t => (
          <div className="card admin-row" key={t.id} onClick={() => openPlayers(t)}>
            <div className="admin-row-main">
              <strong>{t.title}</strong>
              <span className={`badge ${t.status === 'live' ? 'badge-live' : 'badge-warning'}`}>{t.status}</span>
            </div>
            <div className="admin-row-sub">
              {t.joinedPlayers ? Object.keys(t.joinedPlayers).length : 0}/{t.target || 50} joined • Entry ₹{t.entry || 0}
            </div>
          </div>
        ))}
        {active.length === 0 && <div className="empty-state">No active tournaments</div>}

        <h3 className="admin-section-title">Completed</h3>
        {tournaments.filter(t => t.status === 'completed').map(t => (
          <div className="card admin-row" key={t.id} onClick={() => openPlayers(t)}>
            <div className="admin-row-main">
              <strong>{t.title}</strong>
              <span className="badge badge-success">completed</span>
            </div>
            <div className="admin-row-sub">Winner: {t.winner_name || '—'} ({t.winner_uid || '-'})</div>
          </div>
        ))}
      </div>

      {/* Players / result modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? selected.title : ''}>
        {selected && (
          <>
            <div className="ud-grid" style={{ marginBottom: 12 }}>
              <div><span>Status</span><strong>{selected.status}</strong></div>
              <div><span>Joined</span><strong>{players.length}/{selected.target || 50}</strong></div>
              <div><span>Prize</span><strong>₹{selected.prize || 0}</strong></div>
              <div><span>Winner</span><strong>{selected.winner_name || '—'}</strong></div>
            </div>

            {players.length === 0 ? (
              <div className="empty-state">No players joined yet</div>
            ) : players.map((p, i) => (
              <div className="player-list-item" key={p.uid}>
                <div className="pl-num">#{i + 1}</div>
                <div className="pl-info">
                  <h5>{p.ffName}</h5>
                  <p>UID: {p.ffUid}</p>
                </div>
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => setCredit({ uid: p.uid, name: p.ffName, amount: '' })}>
                  Credit Win
                </button>
              </div>
            ))}

            {credit.uid && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: 'var(--bg-surface)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Credit Win — {credit.name}</div>
                <input className="input-field" type="number" placeholder="Win amount ₹" value={credit.amount} onChange={e => setCredit(c => ({ ...c, amount: e.target.value }))} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={doCredit} disabled={saving}>{saving ? 'Saving...' : 'Add Win Transaction'}</button>
                  <button className="btn btn-outline" onClick={() => setCredit({ uid: '', name: '', amount: '' })}>Cancel</button>
                </div>
              </div>
            )}

            {selected.status !== 'completed' && (
              <button className="btn btn-danger" style={{ width: '100%', marginTop: 14 }} onClick={markCompleted} disabled={saving}>
                Mark Tournament Completed
              </button>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
