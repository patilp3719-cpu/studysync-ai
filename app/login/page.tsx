'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await signIn('credentials', { email, password, callbackUrl: '/dashboard' })
    setLoading(false)
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
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#dfe2ee' }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: '#958ea0' }}>Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{
          background: 'rgba(19,27,46,0.8)',
          border: '1px solid rgba(51,65,85,0.4)',
          backdropFilter: 'blur(16px)',
        }}>
          {urlError && (
            <div className="mb-4 rounded-lg px-3 py-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ffb4ab' }}>
              Invalid email or password. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: '#958ea0' }}>Email</label>
              <input
                id="email" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#8B5CF6'
                  e.currentTarget.style.boxShadow = '0 0 0 1px #8B5CF6'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: '#958ea0' }}>Password</label>
              <input
                id="password" type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Your password"
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#8B5CF6'
                  e.currentTarget.style.boxShadow = '0 0 0 1px #8B5CF6'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: '#958ea0' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: '#d0bcff' }} className="font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
