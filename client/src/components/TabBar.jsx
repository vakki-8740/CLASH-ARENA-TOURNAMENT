import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/home', label: 'Home', icon: 'house' },
  { path: '/matches', label: 'Matches', icon: 'gamepad' },
  { path: '/rank', label: 'Rank', icon: 'trophy' },
  { path: '/wallet', label: 'Wallet', icon: 'wallet' },
  { path: '/profile', label: 'Profile', icon: 'person' },
]

const icons = {
  house: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 010-5H6m12 5h1.5a2.5 2.5 0 000-5H18M6 9v6a3 3 0 003 3h6a3 3 0 003-3V9M6 9h12M9 3h6"/></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a2 2 0 100-4 2 2 0 000 4z"/></svg>,
  person: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  gamepad: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 12h4m-2-2v4m7-3h.01M18 10h.01M17.32 5H6.68a4 4 0 00-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 003 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 019.828 16h4.344a2 2 0 011.414.586L17 18c.5.5 1 1 2 1a3 3 0 003-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0017.32 5z"/></svg>,
}

export default function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname.startsWith('/admin')) return null

  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <button
          key={tab.path}
          className={`tab-item ${location.pathname === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="tab-icon">{icons[tab.icon]}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
