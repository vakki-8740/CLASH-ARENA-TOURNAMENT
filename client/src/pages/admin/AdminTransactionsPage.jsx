import React, { useEffect, useState } from 'react'
import FB from '../../lib/fb'
import AdminHeader from '../../components/AdminHeader'

// Admin Transactions (replaces admin.html transactions section + admin.js loadTransactions/approve)
export default function AdminTransactions({ showToast }) {
  const [txs, setTxs] = useState([])
  const [filter, setFilter] = useState({ type: '', status: '' })
  const [busy, setBusy] = useState(false)

  const load = () => FB.getAllTransactions().then(setTxs).catch(() => showToast('Load failed', 'error'))
  useEffect(() => { load() }, []) // eslint-disable-line

  const filtered = txs.filter(tx =>
    (!filter.type || tx.type === filter.type) &&
    (!filter.status || tx.status === filter.status)
  )

  const setStatus = async (tx, status) => {
    if (!window.confirm(`Set this ${tx.type} of ₹${tx.amount} to ${status}?`)) return
    setBusy(true)
    try {
      await FB.updateTransaction(tx.id, status)
      showToast('Transaction ' + status)
      load()
    } catch (e) { showToast('Error: ' + e.message, 'error') }
    setBusy(false)
  }

  const statusColor = (s) => s === 'Success' ? 'var(--green)' : s === 'Rejected' ? 'var(--red)' : 'var(--gold)'

  return (
    <div className="admin-page">
      <AdminHeader title="Transactions" />
      <div className="admin-body">
        <div className="admin-filters">
          <select className="input-field" value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            <option>Deposit</option>
            <option>Withdraw</option>
            <option>Join Fee</option>
            <option>Win</option>
          </select>
          <select className="input-field" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option>Pending</option>
            <option>Success</option>
            <option>Rejected</option>
          </select>
        </div>

        {filtered.map(tx => (
          <div className="card admin-row" key={tx.id}>
            <div className="admin-row-main">
              <strong>{tx.type} — ₹{tx.amount}</strong>
              <span style={{ color: statusColor(tx.status), fontWeight: 700, fontSize: 12 }}>{tx.status}</span>
            </div>
            <div className="admin-row-sub">
              {tx.datetime ? new Date(tx.datetime).toLocaleString('en-IN') : '-'} • {tx.type === 'Deposit' ? 'UTR: ' + (tx.utr || '-') : tx.type === 'Withdraw' ? (tx.upi || '-') : ''}
            </div>
            {tx.status === 'Pending' && (tx.type === 'Deposit' || tx.type === 'Withdraw') && (
              <div className="admin-row-actions">
                {tx.type === 'Deposit' ? (
                  <button className="btn btn-primary" disabled={busy} onClick={() => setStatus(tx, 'Success')}>✓ Approve Deposit</button>
                ) : (
                  <button className="btn btn-primary" disabled={busy} onClick={() => setStatus(tx, 'Success')}>✓ Mark Paid</button>
                )}
                <button className="btn btn-danger" disabled={busy} onClick={() => setStatus(tx, 'Rejected')}>✕ Reject</button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state">No transactions</div>}
      </div>
    </div>
  )
}
