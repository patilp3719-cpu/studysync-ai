'use client'

import { useTimer } from './TimerContext'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { IconPause, IconExternalLink } from './Icons'

export default function FloatingTimerBar() {
  const { state, pause } = useTimer()
  const pathname = usePathname()

  if (!state.running || pathname === '/timer') return null

  const mins = Math.floor(state.secondsLeft / 60).toString().padStart(2, '0')
  const secs = (state.secondsLeft % 60).toString().padStart(2, '0')
  const total = state.phase === 'focus' ? state.focusMins * 60 : state.breakMins * 60
  const progress = ((total - state.secondsLeft) / total) * 100
  const isFocus = state.phase === 'focus'

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-b-xl px-4 py-2"
      style={{
        background: 'rgba(10,14,22,0.95)',
        border: '1px solid rgba(73,68,84,0.5)',
        borderTop: 'none',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>

      {/* Circular progress ring */}
      <div className="relative w-8 h-8 shrink-0">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(73,68,84,0.5)" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="13" fill="none"
            stroke={isFocus ? '#8B5CF6' : '#10B981'}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] font-bold font-mono" style={{ color: isFocus ? '#d0bcff' : '#10B981' }}>
            {isFocus ? 'F' : 'B'}
          </span>
        </div>
      </div>

      {/* Timer display */}
      <div>
        <div className="text-sm font-mono font-bold tabular-nums" style={{ color: '#dfe2ee' }}>
          {mins}:{secs}
        </div>
        <div className="text-[10px] font-mono leading-none" style={{ color: '#958ea0' }}>
          {state.category
            ? state.category.split('/')[0].trim()
            : isFocus ? 'Focus' : 'Break'}
        </div>
      </div>

      {/* Pause */}
      <button
        onClick={pause}
        className="p-1.5 rounded-lg transition-all duration-150"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#cbc3d7' }}
        aria-label="Pause timer"
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
        <IconPause size={13} strokeWidth={2} />
      </button>

      {/* Open timer */}
      <Link href="/timer"
        className="p-1.5 rounded-lg transition-all duration-150"
        style={{ color: '#958ea0' }}
        aria-label="Open timer">
        <IconExternalLink size={13} strokeWidth={2} />
      </Link>
    </div>
  )
}
