import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDgpxfAcGZS_s33PAdZDSQLSAjulENCgfg",
  authDomain: "arena-tournament-f2f8e.firebaseapp.com",
  projectId: "arena-tournament-f2f8e",
  storageBucket: "arena-tournament-f2f8e.firebasestorage.app",
  messagingSenderId: "937940312175",
  appId: "1:937940312175:web:7837d22b8c233db91ced9a"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
