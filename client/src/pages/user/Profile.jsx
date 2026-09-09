import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../components/Card'
import FB from '../../lib/fb'
import AppHeader from '../../components/AppHeader'
import Icon from '../../components/Icon'

// Profile page (replaces user/profile.html + profile.js)
export default function UserProfile({ user, onUser, onLogout, showToast }) {
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState({ name: user.name || '', ffName: user.ff_name || '', ffUid: user.ff_uid || '' })
  const [stats, setStats] = useState({ dep: 0, wit: 0, earn: 0, wins: 0 })
  const [settings, setSettings] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    FB.getTransactions(user.uid).then(txs => {
      let totalDep = 0, totalWit = 0, totalWinAmt = 0, totalWins = 0
      txs.forEach(tx => {
        if (tx.status === 'Success') {
          if (tx.type === 'Deposit') totalDep += Number(tx.amount)
          if (tx.type === 'Withdraw') totalWit += Number(tx.amount)
          if (tx.type === 'Win') { totalWinAmt += Number(tx.amount); totalWins++ }
        }
      })
      setStats({ dep: totalDep, wit: totalWit, earn: totalWinAmt, wins: totalWins })
    }).catch(() => {})
    FB.getSettings().then(setSettings).catch(() => {})
  }, [user.uid])

  const saveProfile = async () => {
    if (!form.name.trim()) { showToast('Name is required', 'error'); return }
    setSaving(true)
    try {
      await FB.updateUser(user.uid, { name: form.name.trim(), ff_name: form.ffName.trim(), ff_uid: form.ffUid.trim() })
      showToast('Profile Updated!')
      setShowEdit(false)
      const fresh = await FB.getUser(user.uid)
      if (fresh && onUser) onUser(fresh)
    } catch (e) { showToast('Update Failed', 'error') }
    setSaving(false)
  }


  // Avatar: pick image -> center-crop to square via canvas -> save as base64
  const uploadAvatar = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB!', 'error'); return }
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = async () => {
        const size = 400
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill(); ctx.clip()
        const fitScale = Math.max(size / img.naturalWidth, size / img.naturalHeight)
        const drawW = img.naturalWidth * fitScale
        const drawH = img.naturalHeight * fitScale
        ctx.drawImage(img, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH)
        const cropped = canvas.toDataURL('image/jpeg', 0.85)
        showToast('Uploading...')
        try {
          await FB.updateUser(user.uid, { avatar: cropped })
          const fresh = await FB.getUser(user.uid)
          if (fresh && onUser) onUser(fresh)
          showToast('Photo updated!')
        } catch (err) { showToast('Upload failed: ' + err.message, 'error') }
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const openAdminLink = (type) => {
    const url = type === 'telegram' ? settings.telegram : settings.help
    if (url && url.trim() !== '') window.open(url, '_blank')
    else showToast('Link not updated by admin yet!', 'error')
  }


  return (
    <div className="app-container">
      <AppHeader user={user} />
      <div className="page-content">
        <div className="profile-hero card">
          <label className="profile-avatar-wrap">
            <div
              className="profile-avatar"
              style={user.avatar ? { backgroundImage: `url('${user.avatar}')` } : {}}
            >{!user.avatar && (user.name || 'U').charAt(0).toUpperCase()}</div>
            <span className="profile-avatar-edit"><Icon name="camera" size={16} /></span>
            <input type="file" accept="image/*" hidden onChange={uploadAvatar} />
          </label>
          <h2 className="profile-name">{user.name || 'User'}</h2>
          <p className="profile-sub">{user.phone || user.email || 'QBIT Player'}</p>
        </div>

        <div className="wallet-stats">
          <div className="wallet-stat"><span>Total Deposit</span><strong style={{ color: 'var(--green)' }}>₹{stats.dep}</strong></div>
          <div className="wallet-stat"><span>Total Withdraw</span><strong style={{ color: 'var(--red)' }}>₹{stats.wit}</strong></div>
          <div className="wallet-stat"><span>Total Earning</span><strong style={{ color: 'var(--gold)' }}>₹{stats.earn}</strong></div>
          <div className="wallet-stat"><span>Matches Won</span><strong>{stats.wins}</strong></div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="list-item">
              <span><Icon name="gamePad" size={16} /></span>
            <div className="list-item-content">
              <div className="list-item-title">FF Name: {user.ff_name || 'Not Set'}</div>
            </div>
          </div>
          <div className="list-item">
            <span><Icon name="hashtag" size={16} /></span>
            <div className="list-item-content">
              <div className="list-item-title">FF UID: {user.ff_uid || 'Not Set'}</div>
            </div>
          </div>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => { setForm({ name: user.name || '', ffName: user.ff_name || '', ffUid: user.ff_uid || '' }); setShowEdit(true) }}>
            <Icon name="edit" size={16} /> Edit Profile
          </button>
          </div>

        <div className="settings-list card">
          <div className="setting-item" onClick={() => navigate('/settings')}><span><Icon name="settings" size={16} /> Settings</span><i className="chev"><Icon name="chevronRight" size={14} /></i></div>
          <div className="setting-item" onClick={() => openAdminLink('telegram')}><span><Icon name="telegram" size={16} /> Join Telegram</span><i className="chev"><Icon name="chevronRight" size={14} /></i></div>
          <div className="setting-item" onClick={() => openAdminLink('help')}><span><Icon name="info" size={16} /> Help & Support</span><i className="chev"><Icon name="chevronRight" size={14} /></i></div>
          <div className="setting-item" onClick={() => navigate('/admin/login')}><span><Icon name="shield" size={16} /> Admin Panel</span><i className="chev"><Icon name="chevronRight" size={14} /></i></div>
        </div>

        <button className="btn btn-danger" style={{ width: '100%', marginTop: 16 }} onClick={() => {
          if (window.confirm('Are you sure you want to logout?')) onLogout()
        }}>Logout</button>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Profile">
        <div className="input-group">
          <label className="input-label">Name</label>
          <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
        </div>
        <div className="input-group">
          <label className="input-label">Free Fire Name</label>
          <input className="input-field" value={form.ffName} onChange={e => setForm({ ...form, ffName: e.target.value })} placeholder="FF in-game name" />
        </div>
        <div className="input-group">
          <label className="input-label">Free Fire UID</label>
          <input className="input-field" value={form.ffUid} onChange={e => setForm({ ...form, ffUid: e.target.value })} placeholder="FF UID" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={saveProfile} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </Modal>
    </div>
  )
}

