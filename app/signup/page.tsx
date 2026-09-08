'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/login')
    } else {
      const data = await res.json()
      setError(data.message || 'Registration failed')
    }
  }

  const inputStyle = {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(51,65,85,0.6)',
    color: '#dfe2ee',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  }

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = '#8B5CF6'
      e.currentTarget.style.boxShadow = '0 0 0 1px #8B5CF6'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)'
      e.currentTarget.style.boxShadow = 'none'
    },
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0B0F17' }}>

      {/* Background ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}>
              <span className="text-base">📚</span>
            </div>
            <span className="font-bold text-base" style={{ color: '#dfe2ee' }}>
              StudySync <span style={{ color: '#d0bcff' }}>AI</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#dfe2ee' }}>Create account</h1>
          <p className="text-sm mt-1" style={{ color: '#958ea0' }}>Join your AI study workspace</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{
          background: 'rgba(19,27,46,0.8)',
          border: '1px solid rgba(51,65,85,0.4)',
          backdropFilter: 'blur(16px)',
        }}>
          {error && (
            <div className="mb-4 rounded-lg px-3 py-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ffb4ab' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: '#958ea0' }}>Name</label>
              <input
                id="name" type="text" required
                value={name} onChange={e => setName(e.target.value)}
                style={inputStyle} placeholder="Your full name"
                {...focusHandlers}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: '#958ea0' }}>Email</label>
              <input
                id="email" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} placeholder="you@example.com"
                {...focusHandlers}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: '#958ea0' }}>Password</label>
              <input
                id="password" type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle} placeholder="Minimum 6 characters"
                {...focusHandlers}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 mt-2"
              style={{
                background: loading ? 'rgba(139,92,246,0.5)' : '#8B5CF6',
                color: '#fff',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={e => !loading && ((e.currentTarget.style.background = '#7C3AED'), (e.currentTarget.style.boxShadow = '0 0 16px rgba(139,92,246,0.35)'))}
              onMouseLeave={e => !loading && ((e.currentTarget.style.background = '#8B5CF6'), (e.currentTarget.style.boxShadow = 'none'))}>
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: '#958ea0' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#d0bcff' }} className="font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
