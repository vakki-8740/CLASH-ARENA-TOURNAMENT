import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import Icon from '../../components/Icon'

export default function AdminApp({ showToast }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, pass)
      showToast('Login Successful!')
      navigate('/admin')
    } catch (err) {
      setError('Invalid Credentials!')
    }
    setLoading(false)
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-card card" onSubmit={handleLogin}>
        <div className="admin-login-logo"><Icon name="shield" size={42} /></div>
        <h1>QBIT SPORTS</h1>
        <p className="admin-login-sub">Admin Panel</p>

        <div className="input-group">
          <label className="input-label">Email</label>
          <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@email.com" required />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input className="input-field" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
        </div>

        {error && <div className="admin-login-error">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
        <button type="button" className="admin-login-back" onClick={() => navigate('/home')}><Icon name="back" size={16} /> Back to App</button>
      </form>
    </div>
  )
}
