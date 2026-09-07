// ================================================
// FIREBASE DATABASE - Direct Firestore Operations
// No backend server needed (React port of user/firebase-db.js)
// ================================================
import { auth, db, googleProvider } from './firebase'
import {
  signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
} from 'firebase/auth'
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  writeBatch, query, where, limit
} from 'firebase/firestore'

const now = () => new Date().toISOString()

export const FB = {
  // ==================== AUTH ====================
  async googleLogin() {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    const userDoc = await getDoc(doc(db, 'users', user.uid))

    if (!userDoc.exists) {
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName || 'User',
        email: user.email || '',
        avatar: user.photoURL || '',
        phone: '', ff_name: '', ff_uid: '',
        balance: 0, status: 'Active',
        saved_upi: '', saved_bank: '',
        login_method: 'google',
        created_at: now(), updated_at: now()
      })
    }

    const data = (await getDoc(doc(db, 'users', user.uid))).data()
    localStorage.setItem('arena_uid', user.uid)
    return { uid: user.uid, ...data }
  },

  async registerPhone(name, phone, password) {
    const phoneSnap = await getDocs(query(collection(db, 'users'), where('phone', '==', phone), limit(1)))
    if (!phoneSnap.empty) throw new Error('Already registered')

    const email = phone + '@arena.app'
    const cred = await createUserWithEmailAndPassword(auth, email, password)

    await setDoc(doc(db, 'users', cred.user.uid), {
      name, phone, email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}&backgroundColor=b6e3f4`,
      ff_name: '', ff_uid: '', balance: 0, status: 'Active',
      saved_upi: '', saved_bank: '', login_method: 'local',
      created_at: now(), updated_at: now()
    })

    localStorage.setItem('arena_uid', cred.user.uid)
    const data = (await getDoc(doc(db, 'users', cred.user.uid))).data()
    return { uid: cred.user.uid, ...data }
  },

  async loginPhone(phone, password) {
    const phoneSnap = await getDocs(query(collection(db, 'users'), where('phone', '==', phone), limit(1)))
    if (phoneSnap.empty) throw new Error('Account not found')

    const userData = phoneSnap.docs[0].data()
    const email = userData.email || phone + '@arena.app'
    const cred = await signInWithEmailAndPassword(auth, email, password)

    localStorage.setItem('arena_uid', cred.user.uid)
    return { uid: cred.user.uid, ...userData }
  },

  async logout() {
    await signOut(auth)
    localStorage.removeItem('arena_uid')
  },

  getCurrentUid() {
    return auth.currentUser?.uid || localStorage.getItem('arena_uid') || null
  },

  // ==================== USERS ====================
  async getUser(uid) {
    const d = await getDoc(doc(db, 'users', uid))
    return d.exists() ? { id: d.id, ...d.data() } : null
  },

  async updateUser(uid, data) {
    data.updated_at = now()
    await updateDoc(doc(db, 'users', uid), data)
  },

  async getAllUsers() {
    const snap = await getDocs(collection(db, 'users'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async deleteUser(uid) {
    const batch = writeBatch(db)
    const pv = await getDocs(query(collection(db, 'poll_votes'), where('user_id', '==', uid)))
    pv.forEach(d => batch.delete(d.ref))
    const jp = await getDocs(query(collection(db, 'joined_players'), where('user_id', '==', uid)))
    jp.forEach(d => batch.delete(d.ref))
    const tx = await getDocs(query(collection(db, 'transactions'), where('user_id', '==', uid)))
    tx.forEach(d => batch.delete(d.ref))
    batch.delete(doc(db, 'users', uid))
    await batch.commit()
  },

  // ==================== TOURNAMENTS ====================
  async getTournaments() {
    const [tSnap, pSnap] = await Promise.all([
      getDocs(collection(db, 'tournaments')),
      getDocs(collection(db, 'joined_players'))
    ])

    const allPlayers = {}
    pSnap.forEach(p => {
      const pd = p.data()
      if (!allPlayers[pd.tournament_id]) allPlayers[pd.tournament_id] = {}
      allPlayers[pd.tournament_id][pd.user_id] = { ffName: pd.ff_name, ffUid: pd.ff_uid, avatar: pd.avatar }
    })

    return tSnap.docs.map(d => ({ id: d.id, ...d.data(), joinedPlayers: allPlayers[d.id] || {}, showRoom: !!d.data().show_room }))
  },

  async createTournament(data) {
    const docRef = await addDoc(collection(db, 'tournaments'), {
      image: data.image || '', title: data.title, map: data.map || 'Bermuda',
      type: data.type || 'Solo', status: data.status || 'live',
      entry: data.entry || 0, prize: data.prize || 0, kill: data.kill || 0,
      time: data.time || 'TBA', raw_time_obj: data.rawTimeObj || '',
      target: data.target || 50, room_id: data.roomId || '', room_pass: data.roomPass || '',
      show_room: !!data.showRoom, winner_name: data.winnerName || '',
      winner_uid: data.winnerUid || '', rules: data.rules || '',
      created_at: now()
    })
    return docRef.id
  },

  async updateTournament(id, data) {
    await updateDoc(doc(db, 'tournaments', id), {
      image: data.image || '', title: data.title, map: data.map,
      type: data.type || 'Solo', status: data.status,
      entry: data.entry || 0, prize: data.prize || 0, kill: data.kill || 0,
      time: data.time || 'TBA', raw_time_obj: data.rawTimeObj || '',
      target: data.target || 50, room_id: data.roomId || '', room_pass: data.roomPass || '',
      show_room: !!data.showRoom, winner_name: data.winnerName || '',
      winner_uid: data.winnerUid || '', rules: data.rules || ''
    })
  },

  async deleteTournament(id) {
    const batch = writeBatch(db)
    const jp = await getDocs(query(collection(db, 'joined_players'), where('tournament_id', '==', id)))
    jp.forEach(d => batch.delete(d.ref))
    batch.delete(doc(db, 'tournaments', id))
    await batch.commit()
  },

  async joinTournament(tid, uid, ffName, ffUid) {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (!userDoc.exists) throw new Error('User not found')
    const user = userDoc.data()

    const tDoc = await getDoc(doc(db, 'tournaments', tid))
    if (!tDoc.exists) throw new Error('Tournament not found')
    const tournament = tDoc.data()

    if ((user.balance || 0) < tournament.entry) throw new Error('Insufficient balance')

    const existing = await getDocs(query(
      collection(db, 'joined_players'),
      where('tournament_id', '==', tid),
      where('user_id', '==', uid),
      limit(1)
    ))
    if (!existing.empty) throw new Error('Already joined')

    const newBal = (user.balance || 0) - tournament.entry
    await updateDoc(doc(db, 'users', uid), { balance: newBal })
    await addDoc(collection(db, 'joined_players'), {
      tournament_id: tid, user_id: uid, ff_name: ffName, ff_uid: ffUid,
      avatar: user.avatar, joined_at: now()
    })
    await addDoc(collection(db, 'transactions'), {
      user_id: uid, type: 'Join Fee', amount: tournament.entry, utr: '', upi: '',
      tournament_id: tid, status: 'Success', datetime: now()
    })

    return { balance: newBal }
  },

  // ==================== TRANSACTIONS ====================
  async getTransactions(uid) {
    const snap = await getDocs(query(collection(db, 'transactions'), where('user_id', '==', uid)))
    const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    txs.sort((a, b) => (b.datetime || '').localeCompare(a.datetime || ''))
    return txs
  },

  async getAllTransactions() {
    const snap = await getDocs(collection(db, 'transactions'))
    const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    txs.sort((a, b) => (b.datetime || '').localeCompare(a.datetime || ''))
    return txs
  },

  async submitDeposit(uid, amount, utr) {
    const userDoc = await getDoc(doc(db, 'users', uid))
    const user = userDoc.data()
    await addDoc(collection(db, 'transactions'), {
      user_id: uid, type: 'Deposit', amount, utr, upi: '',
      tournament_id: null, status: 'Pending', datetime: now()
    })
    return { name: user.name, phone: user.phone, email: user.email }
  },

  async submitWithdraw(uid, amount, method) {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (!userDoc.exists) throw new Error('User not found')
    const user = userDoc.data()

    if (amount < 100) throw new Error('Min ₹100')
    if ((user.balance || 0) < amount) throw new Error('Insufficient balance')

    const newBal = (user.balance || 0) - amount
    await updateDoc(doc(db, 'users', uid), { balance: newBal })
    await addDoc(collection(db, 'transactions'), {
      user_id: uid, type: 'Withdraw', amount, utr: '', upi: method || '',
      tournament_id: null, status: 'Pending', datetime: now()
    })

    return { balance: newBal, name: user.name, phone: user.phone, email: user.email }
  },

  async updateTransaction(txId, status) {
    const txDoc = await getDoc(doc(db, 'transactions', txId))
    if (!txDoc.exists) throw new Error('Not found')
    const tx = txDoc.data()

    await updateDoc(doc(db, 'transactions', txId), { status })

    if (status === 'Success' && tx.type === 'Deposit') {
      const uDoc = await getDoc(doc(db, 'users', tx.user_id))
      const bal = uDoc.exists ? (uDoc.data().balance || 0) : 0
      await updateDoc(doc(db, 'users', tx.user_id), { balance: bal + tx.amount })
    } else if (status === 'Rejected' && tx.type === 'Withdraw') {
      const uDoc = await getDoc(doc(db, 'users', tx.user_id))
      const bal = uDoc.exists ? (uDoc.data().balance || 0) : 0
      await updateDoc(doc(db, 'users', tx.user_id), { balance: bal + tx.amount })
    }
  },

  // Credit a prize win to a user (used by Admin Matches page)
  async addWin(uid, amount, tid) {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (!userDoc.exists) throw new Error('User not found')
    const newBal = (userDoc.data().balance || 0) + Number(amount)
    await updateDoc(doc(db, 'users', uid), { balance: newBal })
    await addDoc(collection(db, 'transactions'), {
      user_id: uid, type: 'Win', amount: Number(amount), utr: '', upi: '',
      tournament_id: tid || null, status: 'Success', datetime: now()
    })
    return { balance: newBal }
  },

  // ==================== POLLS ====================
  async getPolls() {
    const [pSnap, vSnap] = await Promise.all([
      getDocs(collection(db, 'polls')),
      getDocs(collection(db, 'poll_votes'))
    ])

    const allVotes = {}
    vSnap.forEach(v => {
      const vd = v.data()
      if (!allVotes[vd.poll_id]) allVotes[vd.poll_id] = {}
      allVotes[vd.poll_id][vd.user_id] = vd.option_key
    })

    return pSnap.docs.map(d => {
      const p = d.data()
      return { id: d.id, question: p.question, status: p.status, options: p.options || {}, votes: allVotes[d.id] || {} }
    })
  },

  async createPoll(question, status, options) {
    const docRef = await addDoc(collection(db, 'polls'), {
      question, status: status || 'active', options: options || {},
      created_at: now()
    })
    return docRef.id
  },

  async updatePoll(id, question, status, options) {
    await updateDoc(doc(db, 'polls', id), { question, status, options: options || {} })
  },

  async deletePoll(id) {
    const batch = writeBatch(db)
    const pv = await getDocs(query(collection(db, 'poll_votes'), where('poll_id', '==', id)))
    pv.forEach(d => batch.delete(d.ref))
    batch.delete(doc(db, 'polls', id))
    await batch.commit()
  },

  async votePoll(pollId, uid, optionKey) {
    await setDoc(doc(db, 'poll_votes', pollId + '_' + uid), {
      poll_id: pollId, user_id: uid, option_key: optionKey
    })
  },

  // ==================== SETTINGS ====================
  async getSettings() {
    const snap = await getDocs(collection(db, 'settings'))
    const s = {}
    snap.forEach(d => { s[d.id] = d.data().value })
    return s
  },

  async updateSettings(data) {
    const batch = writeBatch(db)
    Object.entries(data).forEach(([key, value]) => {
      batch.set(doc(db, 'settings', key), { value: String(value) })
    })
    await batch.commit()
  },

  // ==================== STATS ====================
  async getStats() {
    const [usersSnap, txSnap, tSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'transactions')),
      getDocs(collection(db, 'tournaments'))
    ])

    let deposits = 0, withdrawals = 0, activeTournaments = 0
    txSnap.forEach(d => {
      const t = d.data()
      if (t.type === 'Deposit' && t.status === 'Success') deposits += t.amount || 0
      if (t.type === 'Withdraw' && t.status === 'Success') withdrawals += t.amount || 0
    })
    tSnap.forEach(d => { if (d.data().status !== 'completed') activeTournaments++ })

    return { users: usersSnap.size, deposits, withdrawals, tournaments: activeTournaments }
  }
}

export default FB

