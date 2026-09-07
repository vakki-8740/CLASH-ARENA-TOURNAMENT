import React, { useEffect, useState } from 'react'
import FB from '../../lib/fb'
import AdminHeader from '../../components/AdminHeader'

// Admin Dashboard (replaces admin.html dashboard section + admin.js loadAllData stats)
export default function AdminDashboard({ showToast }) {
  const [stats, setStats] = useState(null)
  const [txs, setTxs] = useState([])

  useEffect(() => {
    FB.getStats().then(setStats).catch(() => showToast('Failed to load stats', 'error'))
    FB.getAllTransactions().then(setTxs).catch(() => {})
  }, []) // eslint-disable-line

  const pendingDep = txs.filter(t => t.status === 'Pending' && t.type === 'Deposit').length
  const pendingWit = txs.filter(t => t.status === 'Pending' && t.type === 'Withdraw').length

  return (
    <div className="admin-page">
      <AdminHeader title="Dashboard" />
      <div className="admin-body">
        <div className="admin-stat-grid">
          <div className="admin-stat card"><span>Total Users</span><strong>{stats ? stats.users : '-'}</strong></div>
          <div className="admin-stat card"><span>Total Deposits</span><strong style={{ color: 'var(--green)' }}>{stats ? '₹' + Number(stats.deposits).toLocaleString('en-IN') : '-'}</strong></div>
          <div className="admin-stat card"><span>Total Withdrawals</span><strong style={{ color: 'var(--red)' }}>{stats ? '₹' + Number(stats.withdrawals).toLocaleString('en-IN') : '-'}</strong></div>
          <div className="admin-stat card"><span>Active Tournaments</span><strong>{stats ? stats.tournaments : '-'}</strong></div>
        </div>

        <div className="admin-stat-grid">
          <div className={`admin-stat card ${pendingDep ? 'admin-stat-alert' : ''}`}><span>Pending Deposits</span><strong>{pendingDep}</strong></div>
          <div className={`admin-stat card ${pendingWit ? 'admin-stat-alert' : ''}`}><span>Pending Withdrawals</span><strong>{pendingWit}</strong></div>
        </div>

        <h3 className="admin-section-title">Recent Transactions</h3>
        <div className="card">
          {txs.slice(0, 10).map(tx => (
            <div className="tx-item" key={tx.id}>
              <div className="tx-left">
                <div className="tx-details">
                  <div className="tx-type">{tx.type}</div>
                  <div className="tx-desc">{tx.datetime || ''} • {tx.status}</div>
                </div>
              </div>
              <div className="tx-amount">₹{tx.amount}</div>
            </div>
          ))}
          {txs.length === 0 && <div className="empty-state">No transactions</div>}
        </div>
      </div>
    </div>
  )
}
