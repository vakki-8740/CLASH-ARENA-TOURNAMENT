import React, { useEffect, useState } from 'react'
import FB from '../../lib/fb'
import AdminHeader from '../../components/AdminHeader'
import { Modal } from '../../components/Card'

const EMPTY = { image: '', title: '', map: 'Bermuda', type: 'Solo', status: 'live', entry: '', prize: '', kill: '', time: '', target: 50, roomId: '', roomPass: '', showRoom: false, winnerName: '', winnerUid: '', rules: '' }

// Admin Tournaments CRUD (replaces admin.html tournaments section + admin.js loadTournaments etc.)
export default function AdminTournaments({ showToast }) {
  const [tournaments, setTournaments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => FB.getTournaments().then(setTournaments).catch(() => showToast('Load failed', 'error'))
  useEffect(() => { load() }, []) // eslint-disable-line

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const openNew = () => { setEditId(''); setForm(EMPTY); setShowForm(true) }

  const openEdit = (t) => {
    setEditId(t.id)
    let time = ''
    if (t.raw_time_obj) {
      const d = new Date(t.raw_time_obj)
      if (!isNaN(d.getTime())) {
        const p = n => String(n).padStart(2, '0')
        time = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
      }
    }
    setForm({ image: t.image || '', title: t.title || '', map: t.map || 'Bermuda', type: t.type || 'Solo', status: t.status || 'live', entry: t.entry || '', prize: t.prize || '', kill: t.kill || '', time, target: t.target || 50, roomId: t.room_id || '', roomPass: t.room_pass || '', showRoom: !!t.show_room, winnerName: t.winner_name || '', winnerUid: t.winner_uid || '', rules: t.rules || '' })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.title.trim()) { showToast('Title required!', 'error'); return }
    setSaving(true)
    const data = {
      image: form.image, title: form.title.trim(), map: form.map, type: form.type, status: form.status,
      entry: Number(form.entry) || 0, prize: Number(form.prize) || 0, kill: Number(form.kill) || 0,
      time: form.time, rawTimeObj: form.time ? new Date(form.time).toISOString() : '',
      target: Number(form.target) || 50, roomId: form.roomId, roomPass: form.roomPass,
      showRoom: form.showRoom, winnerName: form.winnerName, winnerUid: form.winnerUid, rules: form.rules
    }
    try {
      if (editId) { await FB.updateTournament(editId, data); showToast('Updated!') }
      else { await FB.createTournament(data); showToast('Published!') }
      setShowForm(false)
      load()
    } catch (e) { showToast('Error: ' + e.message, 'error') }
    setSaving(false)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete tournament?')) return
    try { await FB.deleteTournament(id); showToast('Deleted!'); load() } catch (e) { showToast('Error', 'error') }
  }

  return (
    <div className="admin-page">
      <AdminHeader title="Tournaments" />
      <div className="admin-body">
        <button className="btn btn-primary" onClick={openNew}>+ New Tournament</button>

        {tournaments.map(t => (
          <div className="card admin-row" key={t.id}>
            <div className="admin-row-main">
              <strong>{t.title}</strong>
              <span className={`badge ${t.status === 'live' ? 'badge-live' : t.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span>
            </div>
            <div className="admin-row-sub">
              Entry ₹{t.entry || 0} • Prize ₹{t.prize || 0} • Per Kill ₹{t.kill || 0} • {t.joinedPlayers ? Object.keys(t.joinedPlayers).length : 0}/{t.target || 50} joined • {t.map} • {t.type}
            </div>
            <div className="admin-row-actions">
              <button className="btn btn-secondary" onClick={() => openEdit(t)}>Edit</button>
              <button className="btn btn-danger" onClick={() => remove(t.id)}>Delete</button>
            </div>
          </div>
        ))}
        {tournaments.length === 0 && <div className="empty-state">No tournaments yet</div>}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Tournament' : 'New Tournament'}>
        <div className="input-group"><label className="input-label">Image URL</label><input className="input-field" value={form.image} onChange={set('image')} placeholder="https://..." /></div>
        <div className="input-group"><label className="input-label">Title *</label><input className="input-field" value={form.title} onChange={set('title')} /></div>
        <div className="admin-form-row">
          <div className="input-group"><label className="input-label">Map</label><input className="input-field" value={form.map} onChange={set('map')} /></div>
          <div className="input-group"><label className="input-label">Type</label>
            <select className="input-field" value={form.type} onChange={set('type')}><option>Solo</option><option>Duo</option><option>Squad</option></select>
          </div>
          <div className="input-group"><label className="input-label">Status</label>
            <select className="input-field" value={form.status} onChange={set('status')}><option value="live">Live (Open)</option><option value="soon">Soon</option><option value="completed">Completed</option></select>
          </div>
        </div>
        <div className="admin-form-row">
          <div className="input-group"><label className="input-label">Entry ₹</label><input className="input-field" type="number" value={form.entry} onChange={set('entry')} /></div>
          <div className="input-group"><label className="input-label">Prize ₹</label><input className="input-field" type="number" value={form.prize} onChange={set('prize')} /></div>
          <div className="input-group"><label className="input-label">Per Kill ₹</label><input className="input-field" type="number" value={form.kill} onChange={set('kill')} /></div>
        </div>
        <div className="admin-form-row">
          <div className="input-group"><label className="input-label">Match Time</label><input className="input-field" type="datetime-local" value={form.time} onChange={set('time')} /></div>
          <div className="input-group"><label className="input-label">Players Target</label><input className="input-field" type="number" value={form.target} onChange={set('target')} /></div>
        </div>
        <div className="admin-form-row">
          <div className="input-group"><label className="input-label">Room ID</label><input className="input-field" value={form.roomId} onChange={set('roomId')} /></div>
          <div className="input-group"><label className="input-label">Room Password</label><input className="input-field" value={form.roomPass} onChange={set('roomPass')} /></div>
        </div>
        <label className="admin-checkbox"><input type="checkbox" checked={form.showRoom} onChange={set('showRoom')} /> Show room details to joined players</label>
        <div className="admin-form-row">
          <div className="input-group"><label className="input-label">Winner Name</label><input className="input-field" value={form.winnerName} onChange={set('winnerName')} /></div>
          <div className="input-group"><label className="input-label">Winner UID</label><input className="input-field" value={form.winnerUid} onChange={set('winnerUid')} /></div>
        </div>
        <div className="input-group"><label className="input-label">Rules</label><textarea className="input-field" value={form.rules} onChange={set('rules')} /></div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={save} disabled={saving}>{saving ? 'Saving...' : editId ? 'Update Tournament' : 'Publish'}</button>
      </Modal>
    </div>
  )
}
