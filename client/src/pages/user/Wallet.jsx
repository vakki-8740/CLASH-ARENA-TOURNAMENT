import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/Card'
import FB from '../../lib/fb'
import AppHeader from '../../components/AppHeader'

// Wallet page (replaces user/wallet.html + wallet.js)
export default function UserWallet({ user, onUser, showToast }) {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ dep: 0, wit: 0, earn: 0, wins: 0 })
  const [balance, setBalance] = useState(user.balance || 0)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({})
  const [savedUpi, setSavedUpi] = useState(user.saved_upi || '')
  const [savedBank, setSavedBank] = useState(user.saved_bank ? JSON.parse(user.saved_bank) : null)

  // modals
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showPaySetup, setShowPaySetup] = useState(false)
  const [successAnim, setSuccessAnim] = useState(false)

  // forms
  const [depAmount, setDepAmount] = useState('')
  const [depUtr, setDepUtr] = useState('')
  const [withAmount, setWithAmount] = useState('')
  const [withMethod, setWithMethod] = useState('upi')
  const [setupTab, setSetupTab] = useState('upi')
  const [upiInput, setUpiInput] = useState('')
  const [bankForm, setBankForm] = useState({ name: '', acc: '', ifsc: '' })
  const [processing, setProcessing] = useState(false)

  const load = async () => {
    try {
      const [txs, s] = await Promise.all([FB.getTransactions(user.uid), FB.getSettings().catch(() => ({}))])
      setSettings(s)
      let totalDep = 0, totalWit = 0, totalWinAmt = 0, totalWins = 0, bal = 0
      txs.forEach(tx => {
        if (tx.status === 'Success') {
          if (tx.type === 'Deposit') { totalDep += Number(tx.amount); bal += Number(tx.amount) }
          if (tx.type === 'Withdraw') { totalWit += Number(tx.amount); bal -= Number(tx.amount) }
          if (tx.type === 'Win') { totalWinAmt += Number(tx.amount); totalWins++; bal += Number(tx.amount) }
          if (tx.type === 'Join Fee') bal -= Number(tx.amount)
        } else if (tx.status === 'Pending' && tx.type === 'Withdraw') { bal -= Number(tx.amount) }
      })
      setTransactions(txs)
      setStats({ dep: totalDep, wit: totalWit, earn: totalWinAmt, wins: totalWins })
      setBalance(bal)
    } catch (e) { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const refreshUserDoc = async () => {
    const fresh = await FB.getUser(user.uid)
    if (fresh) {
      setSavedUpi(fresh.saved_upi || '')
      setSavedBank(fresh.saved_bank ? JSON.parse(fresh.saved_bank) : null)
      if (onUser) onUser(fresh)
    }
  }


  const downloadQR = () => {
    if (!settings.qrImage) { showToast('QR image not found', 'error'); return }
    const link = document.createElement('a')
    link.download = 'QBIT-QR-Code.png'
    link.href = settings.qrImage
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('QR Downloaded!')
  }

  const submitDeposit = async () => {
    if (!depAmount || Number(depAmount) < 10) { showToast('Minimum deposit ₹10', 'error'); return }
    if (depUtr.length !== 12) { showToast('Enter 12-Digit UTR', 'error'); return }
    setProcessing(true)
    try {
      await FB.submitDeposit(user.uid, Number(depAmount), depUtr)
      showToast('Deposit Request Sent!')
      setShowDeposit(false)
      setDepAmount(''); setDepUtr('')
      load()
    } catch (e) { showToast(e.message, 'error') }
    setProcessing(false)
  }

  const saveUpi = async () => {
    if (!upiInput.includes('@')) { showToast('Invalid UPI ID', 'error'); return }
    setProcessing(true)
    try {
      await FB.updateUser(user.uid, { saved_upi: upiInput })
      setSavedUpi(upiInput)
      showToast('UPI Added!')
      setShowPaySetup(false)
      setShowWithdraw(true)
      setWithMethod('upi')
    } catch (e) { showToast(e.message, 'error') }
    setProcessing(false)
  }

  const saveBank = async () => {
    if (!bankForm.name || !bankForm.acc || !bankForm.ifsc) { showToast('Fill all details', 'error'); return }
    setProcessing(true)
    try {
      await FB.updateUser(user.uid, { saved_bank: JSON.stringify(bankForm) })
      setSavedBank(bankForm)
      showToast('Bank Added!')
      setShowPaySetup(false)
      setShowWithdraw(true)
      setWithMethod('bank')
    } catch (e) { showToast(e.message, 'error') }
    setProcessing(false)
  }

  const submitWithdraw = async () => {
    const amt = Number(withAmount)
    if (amt < 100) { showToast('Min withdraw ₹100', 'error'); return }
    if (amt > balance) { showToast('Insufficient Balance!', 'error'); return }
    if (withMethod === 'upi' && !savedUpi) { showToast('Add a UPI method first', 'error'); return }
    if (withMethod === 'bank' && !savedBank) { showToast('Add a Bank method first', 'error'); return }
    const methodDetails = withMethod === 'upi' ? 'UPI: ' + savedUpi : `Bank: ${savedBank.accNo}`
    setProcessing(true)
    try {
      const res = await FB.submitWithdraw(user.uid, amt, methodDetails)
      setBalance(res.balance)
      setWithAmount('')
      setShowWithdraw(false)
      setSuccessAnim(true)
      setTimeout(() => setSuccessAnim(false), 2500)
      load()
    } catch (e) { showToast(e.message, 'error') }
    setProcessing(false)
  }

  const openWithdraw = () => {
    setWithAmount('')
    if (!savedUpi && !savedBank) { setShowPaySetup(true); return }
    setShowWithdraw(true)
  }


  const txVisual = (tx) => {
    if (tx.type === 'Withdraw') return { cls: 'wit', icon: '↑', sign: '-' }
    if (tx.type === 'Join Fee') return { cls: 'join', icon: '🎮', sign: '-' }
    if (tx.type === 'Win') return { cls: 'dep', icon: '🏆', sign: '+' }
    return { cls: 'dep', icon: '↓', sign: '+' }
  }

  return (
    <div className="app-container">
      <AppHeader user={user} />
      <div className="page-content">
        <div className="wallet-hero">
          <div className="balance-label">Main Wallet Balance</div>
          <div className="balance-amount">₹{balance.toLocaleString('en-IN')}</div>
        </div>

        <div className="wallet-stats">
          <div className="wallet-stat"><span>Total Deposit</span><strong style={{ color: 'var(--green)' }}>₹{stats.dep}</strong></div>
          <div className="wallet-stat"><span>Total Withdraw</span><strong style={{ color: 'var(--red)' }}>₹{stats.wit}</strong></div>
          <div className="wallet-stat"><span>Total Winning</span><strong style={{ color: 'var(--gold)' }}>₹{stats.earn}</strong></div>
          <div className="wallet-stat"><span>Total Wins</span><strong>{stats.wins}</strong></div>
        </div>

        <div className="grid-2">
          <button className="btn btn-primary" onClick={() => setShowDeposit(true)}>💰 Deposit</button>
          <button className="btn btn-secondary" onClick={openWithdraw}>💳 Withdraw</button>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '16px 0 12px' }}>Transaction History</h3>

        {loading ? (
          <div className="text-center" style={{ padding: '40px' }}><div className="spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">No Transactions Yet</div>
        ) : (
          <div className="card">
            {transactions.map(tx => {
              const v = txVisual(tx)
              return (
                <div className="tx-item" key={tx.id}>
                  <div className="tx-left">
                    <div className={`tx-icon ${v.cls}`}>{v.icon}</div>
                    <div className="tx-details">
                      <div className="tx-type">{tx.type}</div>
                      <div className="tx-desc">{tx.datetime || ''} • {tx.status}</div>
                    </div>
                  </div>
                  <div className="tx-amount" style={{ color: v.sign === '+' ? 'var(--green)' : 'var(--text-primary)' }}>
                    {v.sign} ₹{tx.amount}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>


      {/* Deposit modal — QR / UPI from admin settings + UTR */}
      <Modal isOpen={showDeposit} onClose={() => setShowDeposit(false)} title="💰 Add Money">
        {settings.qrImage && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <img src={settings.qrImage} alt="Payment QR" style={{ width: 160, height: 160, borderRadius: 12, objectFit: 'contain', background: '#fff', padding: 8 }} />
            <div><button className="copy-btn" onClick={downloadQR} style={{ marginTop: 6 }}>Download QR</button></div>
          </div>
        )}
        {settings.upiId && (
          <div className="fp-row" style={{ justifyContent: 'center', marginBottom: 12 }}>
            <span>UPI ID:</span><strong>{settings.upiId}</strong>
            <button className="copy-btn" onClick={() => { navigator.clipboard.writeText(settings.upiId); showToast('Copied!') }}>Copy</button>
          </div>
        )}
        <div className="input-group">
          <label className="input-label">Amount (₹)</label>
          <input className="input-field" type="number" value={depAmount} onChange={e => setDepAmount(e.target.value)} placeholder="Min ₹10" />
        </div>
        <div className="input-group">
          <label className="input-label">12-Digit UTR / Transaction ID</label>
          <input className="input-field" value={depUtr} onChange={e => setDepUtr(e.target.value)} placeholder="Enter UTR after payment" maxLength={12} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={submitDeposit} disabled={processing}>
          {processing ? 'Submitting...' : 'Submit Deposit Request'}
        </button>
      </Modal>

      {/* Withdraw modal */}
      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="💳 Withdraw">
        <div className="input-group">
          <label className="input-label">Amount (₹) — Min ₹100</label>
          <input className="input-field" type="number" value={withAmount} onChange={e => setWithAmount(e.target.value)} placeholder="Enter amount" />
        </div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: '10px 0 8px', display: 'block' }}>Select Withdrawal Method</label>
        {savedUpi && (
          <label className="pay-method-radio">
            <input type="radio" name="w_method" checked={withMethod === 'upi'} onChange={() => setWithMethod('upi')} />
            <div className="pm-details"><strong>UPI ID</strong><span>{savedUpi}</span></div>
          </label>
        )}
        {savedBank && (
          <label className="pay-method-radio">
            <input type="radio" name="w_method" checked={withMethod === 'bank'} onChange={() => setWithMethod('bank')} />
            <div className="pm-details"><strong>Bank Account</strong><span>Ac No: {savedBank.accNo} ({savedBank.name})</span></div>
          </label>
        )}
        <button className="btn btn-outline" style={{ width: '100%', marginTop: 10 }} onClick={() => { setShowWithdraw(false); setShowPaySetup(true) }}>
          + Add / Change Payment Method
        </button>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={submitWithdraw} disabled={processing}>
          {processing ? 'Processing...' : 'Submit Withdraw Request'}
        </button>
      </Modal>

      {/* Payment method setup modal */}
      <Modal isOpen={showPaySetup} onClose={() => setShowPaySetup(false)} title="🏦 Payment Method">
        <div className="ios-segment">
          <button className={`segment-btn ${setupTab === 'upi' ? 'active' : ''}`} onClick={() => setSetupTab('upi')}>UPI</button>
          <button className={`segment-btn ${setupTab === 'bank' ? 'active' : ''}`} onClick={() => setSetupTab('bank')}>Bank</button>
        </div>
        {setupTab === 'upi' ? (
          <>
            <div className="input-group">
              <label className="input-label">UPI ID</label>
              <input className="input-field" value={upiInput} onChange={e => setUpiInput(e.target.value)} placeholder="yourname@upi" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={saveUpi} disabled={processing}>Save UPI</button>
          </>
        ) : (
          <>
            <div className="input-group">
              <label className="input-label">Account Holder Name</label>
              <input className="input-field" value={bankForm.name} onChange={e => setBankForm({ ...bankForm, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="input-group">
              <label className="input-label">Account Number</label>
              <input className="input-field" value={bankForm.acc} onChange={e => setBankForm({ ...bankForm, acc: e.target.value })} placeholder="Account number" />
            </div>
            <div className="input-group">
              <label className="input-label">IFSC Code</label>
              <input className="input-field" value={bankForm.ifsc} onChange={e => setBankForm({ ...bankForm, ifsc: e.target.value })} placeholder="IFSC" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={saveBank} disabled={processing}>Save Bank</button>
          </>
        )}
      </Modal>

      {/* Withdraw success animation */}
      {successAnim && (
        <div className="success-anim-overlay">
          <div className="success-anim-circle">✓</div>
          <p>Withdraw Request Sent!</p>
        </div>
      )}
    </div>
  )
}

