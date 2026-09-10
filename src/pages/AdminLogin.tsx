import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import logoDark from '@/imports/SEWA_S__3_-1.png'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a08',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '2rem',
    }}>
      <img src={logoDark} alt="BHS Skales" style={{ height: '80px', marginBottom: '2.5rem', objectFit: 'contain' }} />

      <div style={{
        width: '100%',
        maxWidth: '400px',
        border: '1px solid rgba(201,168,76,0.2)',
        background: '#0f0f0c',
        padding: '2.5rem',
      }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Admin Access
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.75rem', fontWeight: 400, color: '#f5f2eb', marginBottom: '2rem' }}>
          Sign In
        </h1>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,242,235,0.5)', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@shinsfashion.com"
              style={{
                width: '100%',
                background: '#1a1a17',
                border: '1px solid rgba(201,168,76,0.2)',
                color: '#f5f2eb',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,242,235,0.5)', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#1a1a17',
                border: '1px solid rgba(201,168,76,0.2)',
                color: '#f5f2eb',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'rgba(201,168,76,0.5)' : '#c9a84c',
              color: '#0a0a08',
              border: 'none',
              padding: '0.9rem',
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Signing in…' : 'Access Dashboard'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '1.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(245,242,235,0.25)', letterSpacing: '0.08em', textAlign: 'center' }}>
        BHS Skales Admin · Restricted Access
      </div>
    </div>
  )
}
