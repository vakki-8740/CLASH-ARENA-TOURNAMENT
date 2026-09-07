import React, { useEffect, useState } from 'react'
import FB from '../../lib/fb'
import AdminHeader from '../../components/AdminHeader'
import { Modal } from '../../components/Card'

// Admin Users management (replaces admin.html users section + admin.js users/balance/block)
export default function AdminUsers({ showToast }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [editBal, setEditBal] = useState({ id: '', name: '', amount: '' })
  const [saving, setSaving] = useState(false)

  const load = () => FB.getAllUsers().then(setUsers).catch(() => showToast('Load failed', 'error'))
  useEffect(() => { load() }, []) // eslint-disable-line

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q || (u.name || '').toLowerCase().includes(q) || (u.phone || '').includes(q) || (u.email || '').toLowerCase().includes(q)
  })

  const openUser = (u) => setSelected(u)

  const saveBalance = async () => {
    const amt = Number(editBal.amount)
    if (isNaN(amt)) { showToast('Enter a valid amount', 'error'); return }
    setSaving(true)
    try {
      await FB.updateUser(editBal.id, { balance: amt })
      showToast('Balance updated!')
      setEditBal({ id: '', name: '', amount: '' })
      const fresh = await FB.getUser(editBal.id)
      if (selected && selected.id === editBal.id) setSelected(fresh)
      load()
    } catch (e) { showToast('Error', 'error') }
    setSaving(false)
  }

  const toggleBlock = async (u) => {
    const newStatus = u.status === 'Blocked' ? 'Active' : 'Blocked'
    try {
      await FB.updateUser(u.id, { status: newStatus })
      showToast('User ' + newStatus)
      if (selected && selected.id === u.id) setSelected({ ...selected, status: newStatus })
      load()
    } catch (e) { showToast('Error', 'error') }
  }

  const removeUser = async (u) => {
    if (!window.confirm('Delete ' + (u.name || 'user') + ' and all their data?')) return
    try { await FB.deleteUser(u.id); showToast('User deleted'); setSelected(null); load() } catch (e) { showToast('Error', 'error') }
  }

  return (
    <div className="admin-page">
      <AdminHeader title="Users" />
      <div className="admin-body">
        <input className="input-field" placeholder="Search name / phone / email..." value={search} onChange={e => setSearch(e.target.value)} />

        {filtered.map(u => (
          <div className="card admin-row" key={u.id} onClick={() => openUser(u)}>
            <div className="admin-row-main">
              <strong>{u.name || 'User'}</strong>
              <span className={`badge ${u.status === 'Blocked' ? 'badge-danger' : 'badge-success'}`}>{u.status || 'Active'}</span>
            </div>
            <div className="admin-row-sub">
              {u.phone || u.email || '-'} • Balance ₹{u.balance || 0} • FF: {u.ff_name || '-'} ({u.ff_uid || '-'})
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state">No users found</div>}
      </div>

      {/* User detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? (selected.name || 'User') : ''}>
        {selected && (
          <>
            <div className="ud-grid">
              <div><span>Phone</span><strong>{selected.phone || '-'}</strong></div>
              <div><span>Email</span><strong>{selected.email || '-'}</strong></div>
              <div><span>Balance</span><strong>₹{selected.balance || 0}</strong></div>
              <div><span>FF Name</span><strong>{selected.ff_name || '-'}</strong></div>
              <div><span>FF UID</span><strong>{selected.ff_uid || '-'}</strong></div>
              <div><span>Login</span><strong>{selected.login_method || '-'}</strong></div>
              <div><span>Joined</span><strong>{selected.created_at ? new Date(selected.created_at).toLocaleDateString('en-IN') : '-'}</strong></div>
              <div><span>Saved UPI</span><strong>{selected.saved_upi || '-'}</strong></div>
            </div>

            <div className="admin-row-actions" style={{ marginTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => setEditBal({ id: selected.id, name: selected.name, amount: selected.balance || 0 })}>Edit Balance</button>
              <button className="btn btn-warning" onClick={() => toggleBlock(selected)}>{selected.status === 'Blocked' ? 'Unblock' : 'Block'}</button>
              <button className="btn btn-danger" onClick={() => removeUser(selected)}>Delete</button>
            </div>
          </>
        )}
      </Modal>

      {/* Edit balance modal */}
      <Modal isOpen={!!editBal.id} onClose={() => setEditBal({ id: '', name: '', amount: '' })} title={'Edit Balance — ' + editBal.name}>
        <div className="input-group">
          <label className="input-label">New Balance (₹)</label>
          <input className="input-field" type="number" value={editBal.amount} onChange={e => setEditBal(b => ({ ...b, amount: e.target.value }))} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveBalance} disabled={saving}>{saving ? 'Saving...' : 'Save Balance'}</button>
      </Modal>
    </div>
  )
}
