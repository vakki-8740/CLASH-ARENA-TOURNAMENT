import React, { useEffect, useState } from 'react'
import FB from '../../lib/fb'
import AdminHeader from '../../components/AdminHeader'

const FIELDS = [
  { key: 'appName', label: 'App Name' },
  { key: 'appLogo', label: 'App Logo URL' },
  { key: 'qrImage', label: 'Deposit QR Image URL' },
  { key: 'upiId', label: 'UPI ID' },
  { key: 'qrLink', label: 'QR Link' },
  { key: 'minWithdraw', label: 'Min Withdraw (₹)' },
  { key: 'telegram', label: 'Telegram Link' },
  { key: 'help', label: 'Help & Support Link' },
  { key: 'telegramBotToken', label: 'Telegram Bot Token' },
  { key: 'telegramPaymentChannel', label: 'Telegram Payment Channel' },
  { key: 'telegramUserChannel', label: 'Telegram User Channel' },
  { key: 'telegramTournamentChannel', label: 'Telegram Tournament Channel' },
]

// Admin App Settings (replaces admin.html settings section + admin.js loadSettings/saveSettings)
export default function AdminSettings({ showToast }) {
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    FB.getSettings().then(setValues).catch(() => {})
  }, [])

  const set = (k) => (e) => setValues(v => ({ ...v, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      await FB.updateSettings(values)
      showToast('Settings Saved!')
    } catch (e) { showToast('Error', 'error') }
    setSaving(false)
  }

  return (
    <div className="admin-page">
      <AdminHeader title="App Settings" />
      <div className="admin-body">
        {FIELDS.map(f => (
          <div className="input-group" key={f.key}>
            <label className="input-label">{f.label}</label>
            <input className="input-field" value={values[f.key] || ''} onChange={set(f.key)} />
          </div>
        ))}
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
