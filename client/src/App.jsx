import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import FB from './lib/fb'

import Login from './pages/Login'
import Home from './pages/user/Home'
import TournamentDetail from './pages/user/TournamentDetail'
import Matches from './pages/user/Matches'
import Rank from './pages/user/Rank'
import Wallet from './pages/user/Wallet'
import Profile from './pages/user/Profile'
import Settings from './pages/user/Settings'
import AdminApp from './pages/admin/AdminApp'
import AdminDashboard from './pages/admin/AdminDashboardPage'
import AdminTournaments from './pages/admin/AdminTournamentsPage'
import AdminUsers from './pages/admin/AdminUsersPage'
import AdminMatches from './pages/admin/AdminMatchesPage'
import AdminTransactions from './pages/admin/AdminTransactionsPage'
import AdminPolls from './pages/admin/Polls'
import AdminSettings from './pages/admin/Settings'

import TabBar from './components/TabBar'
import AdminTabBar from './components/AdminTabBar'
import Toast from './components/Toast'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = logged out
  const [authUid, setAuthUid] = useState(null) // raw firebase uid (admin may have no users doc)
  const [toast, setToast] = useState(null)
  const [offline, setOffline] = useState(!navigator.onLine)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  // Firebase auth listener — replaces the old /api/auth/session check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setAuthUid(fbUser ? fbUser.uid : null)
      if (fbUser) {
        try {
          const doc = await FB.getUser(fbUser.uid)
          if (doc) {
            localStorage.setItem('arena_uid', fbUser.uid)
            setUser(doc)
          } else {
            setUser(null)
          }
        } catch (e) {
          setUser(null)
        }
      } else {
        localStorage.removeItem('arena_uid')
        setUser(null)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const refreshUser = async () => {
    const uid = FB.getCurrentUid()
    if (!uid) return
    const fresh = await FB.getUser(uid)
    if (fresh) setUser(fresh)
  }

  const logout = async () => {
    await FB.logout()
    setUser(null)
  }

  if (user === undefined) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin panel — Firebase email/password login, own tab bar */}
        <Route path="/admin/login" element={authUid ? <Navigate to="/admin" /> : <AdminApp showToast={showToast} />} />
        <Route path="/admin" element={authUid ? <AdminDashboard showToast={showToast} /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/tournaments" element={authUid ? <AdminTournaments showToast={showToast} /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/users" element={authUid ? <AdminUsers showToast={showToast} /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/matches" element={authUid ? <AdminMatches showToast={showToast} /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/transactions" element={authUid ? <AdminTransactions showToast={showToast} /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/polls" element={authUid ? <AdminPolls showToast={showToast} /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/settings" element={authUid ? <AdminSettings showToast={showToast} /> : <Navigate to="/admin/login" />} />

        {/* User routes */}
        <Route path="/login" element={user ? <Navigate to="/home" /> : <Login onLogin={setUser} showToast={showToast} />} />
        <Route path="/home" element={user ? <Home user={user} showToast={showToast} /> : <Navigate to="/login" />} />
        <Route path="/tournaments/:id" element={user ? <TournamentDetail user={user} showToast={showToast} onUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/matches" element={user ? <Matches user={user} showToast={showToast} /> : <Navigate to="/login" />} />
        <Route path="/rank" element={user ? <Rank user={user} showToast={showToast} /> : <Navigate to="/login" />} />
        <Route path="/wallet" element={user ? <Wallet user={user} showToast={showToast} onUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile user={user} showToast={showToast} onUser={setUser} onLogout={logout} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings user={user} onLogout={logout} showToast={showToast} /> : <Navigate to="/login" />} />

        <Route path="*" element={<Navigate to={user ? '/home' : '/login'} />} />
      </Routes>

      {/* Bottom tab bars (each self-hides on wrong section) */}
      {user && <TabBar />}
      <AdminTabBar />

      {toast && <Toast message={toast.message} type={toast.type} />}
      {offline && <div className="offline-popup">📶 No Internet Connection</div>}
    </BrowserRouter>
  )
}
