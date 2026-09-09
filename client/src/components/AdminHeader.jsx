import React from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import Icon from './Icon'

export default function AdminHeader({ title }) {
  const navigate = useNavigate()
  return (
    <div className="admin-topbar">
      <h2><Icon name="shield" size={20} /> {title}</h2>
      <div className="admin-topbar-actions">
        <button onClick={() => navigate('/home')}>App</button>
        <button className="admin-topbar-logout" onClick={async () => {
          if (window.confirm('Logout from admin?')) {
            await signOut(auth)
            localStorage.removeItem('arena_uid')
            navigate('/admin/login')
          }
        }}>Logout</button>
      </div>
    </div>
  )
}
