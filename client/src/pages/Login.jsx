import React, { useEffect, useState } from 'react'
import FB from '../lib/fb'

// Auth page (replaces user/home.html #auth-page + auth.js handleGoogleLogin)
// Google login — Login & Sign Up both use Google
export default function Login({ onLogin, showToast }) {
  const [loading, setLoading] = useState(false)
  const [appName, setAppName] = useState('QBIT SPORTS')

  useEffect(() => {
    FB.getSettings().then(s => { if (s.appName) setAppName(s.appName) }).catch(() => {})
  }, [])

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const user = await FB.googleLogin()
      showToast('Welcome ' + (user.name || '') + '!')
      setTimeout(() => onLogin(user), 500)
    } catch (error) {
      console.error('Google Login FAILED:', error)
      showToast('Error: ' + error.message, 'error')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="auth-logo-img">
          <img src="https://i.ibb.co/7Jsyh4rt/image.webp" alt={appName} />
        </div>
        <h1 className="auth-logo-text">{appName}</h1>
        <p className="auth-tagline">Play with Skill. Win Big.</p>
      </div>
      <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
        {loading ? (
          <span className="google-btn-loading">Connecting...</span>
        ) : (
          <>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Continue with Google
          </>
        )}
      </button>
      <p className="auth-note">Login or Sign Up both use Google</p>
    </div>
  )
}

