import React, { useEffect, useState } from 'react'
import FB from '../../lib/fb'
import AdminHeader from '../../components/AdminHeader'
import { Modal } from '../../components/Card'

const EMPTY = { question: '', status: 'active', opt1: '', opt2: '', opt3: '', opt4: '' }

// Admin Polls CRUD (replaces admin.html polls section + admin.js poll functions)
export default function AdminPolls({ showToast }) {
  const [polls, setPolls] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState('')
  const [form, setForm] = useState(EMPTY)

  const load = () => FB.getPolls().then(setPolls).catch(() => showToast('Load failed', 'error'))
  useEffect(() => { load() }, []) // eslint-disable-line

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const openNew = () => { setEditId(''); setForm(EMPTY); setShowForm(true) }

  const openEdit = (p) => {
    setEditId(p.id)
    setForm({
      question: p.question || '', status: p.status || 'active',
      opt1: (p.options && p.options.opt1) || '', opt2: (p.options && p.options.opt2) || '',
      opt3: (p.options && p.options.opt3) || '', opt4: (p.options && p.options.opt4) || ''
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.question.trim() || !form.opt1.trim() || !form.opt2.trim()) {
      showToast('Question + 2 options required!', 'error'); return
    }
    const options = { opt1: form.opt1, opt2: form.opt2 }
    if (form.opt3.trim()) options.opt3 = form.opt3
    if (form.opt4.trim()) options.opt4 = form.opt4
    try {
      if (editId) { await FB.updatePoll(editId, form.question.trim(), form.status, options); showToast('Updated!') }
      else { await FB.createPoll(form.question.trim(), form.status, options); showToast('Created!') }
      setShowForm(false)
      load()
    } catch (e) { showToast('Error', 'error') }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete poll?')) return
    try { await FB.deletePoll(id); showToast('Deleted!'); load() } catch (e) { showToast('Error', 'error') }
  }

  return (
    <div className="admin-page">
      <AdminHeader title="Polls" />
      <div className="admin-body">
        <button className="btn btn-primary" onClick={openNew}>+ New Poll</button>

        {polls.map(p => (
          <div className="card admin-row" key={p.id}>
            <div className="admin-row-main">
              <strong>{p.question}</strong>
              <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{p.status}</span>
            </div>
            <div className="admin-row-sub">
              {Object.values(p.options).join(', ')} • {Object.keys(p.votes || {}).length} votes
            </div>
            <div className="admin-row-actions">
              <button className="btn btn-secondary" onClick={() => openEdit(p)}>Edit</button>
              <button className="btn btn-danger" onClick={() => remove(p.id)}>Delete</button>
            </div>
          </div>
        ))}
        {polls.length === 0 && <div className="empty-state">No polls yet</div>}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Poll' : 'New Poll'}>
        <div className="input-group"><label className="input-label">Question *</label><input className="input-field" value={form.question} onChange={set('question')} /></div>
        <div className="input-group"><label className="input-label">Status</label>
          <select className="input-field" value={form.status} onChange={set('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </div>
        <div className="input-group"><label className="input-label">Option 1 *</label><input className="input-field" value={form.opt1} onChange={set('opt1')} /></div>
        <div className="input-group"><label className="input-label">Option 2 *</label><input className="input-field" value={form.opt2} onChange={set('opt2')} /></div>
        <div className="input-group"><label className="input-label">Option 3 (optional)</label><input className="input-field" value={form.opt3} onChange={set('opt3')} /></div>
        <div className="input-group"><label className="input-label">Option 4 (optional)</label><input className="input-field" value={form.opt4} onChange={set('opt4')} /></div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={save}>{editId ? 'Update Poll' : 'Publish Poll'}</button>
      </Modal>
    </div>
  )
}
