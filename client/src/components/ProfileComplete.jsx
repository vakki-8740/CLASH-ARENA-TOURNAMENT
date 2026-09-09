import React, { useState } from 'react'
import FB from '../lib/fb'
import Icon from './Icon'

export default function ProfileComplete({ user, onDone }) {
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    ffName: user?.ff_name || '', ffUid: user?.ff_uid || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setError('')
    if (!form.name.trim()) return setError('Name is required!')
    if (!form.phone.trim() || form.phone.length !== 10) return setError('Enter valid 10-digit phone number!')
    if (!form.ffName.trim()) return setError('FF Name is required!')
    if (!form.ffUid.trim()) return setError('FF UID is required!')

    setSaving(true)
    try {
      await FB.updateUser(user.uid, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        ff_name: form.ffName.trim(),
        ff_uid: form.ffUid.trim()
      })
      const fresh = await FB.getUser(user.uid)
      onDone(fresh)
    } catch (e) {
      setError(e.message || 'Failed to save')
    }
    setSaving(false)
  }

  return (
    <div className="profile-complete-overlay">
      <div className="profile-complete-card">
        <div className="pc-header">
          <div className="pc-icon"><Icon name="user" size={32} /></div>
          <h2>Profile Complete Karo!</h2>
          <p>Fill all details, this popup won't close until done</p>
        </div>
        {error && <div className="pc-error">{error}</div>}
        <div className="pc-field">
          <label>Your Name <span>*</span></label>
          <input type="text" value={form.name} onChange={set('name')} placeholder="Enter your full name" />
        </div>
        <div className="pc-field">
          <label>Phone Number <span>*</span></label>
          <input type="number" value={form.phone} onChange={set('phone')} placeholder="10-Digit Mobile Number" maxLength={10} />
          <div className="pc-hint">Phone number will be used for login</div>
        </div>
        <div className="pc-field">
          <label>Free Fire Name <span>*</span></label>
          <input type="text" value={form.ffName} onChange={set('ffName')} placeholder="FF in-game name" />
        </div>
        <div className="pc-field">
          <label>Free Fire UID <span>*</span></label>
          <input type="number" value={form.ffUid} onChange={set('ffUid')} placeholder="FF UID number" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '5px' }} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
