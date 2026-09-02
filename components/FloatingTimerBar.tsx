'use client'

import { useTimer } from './TimerContext'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { IconPause, IconExternalLink } from './Icons'

export default function FloatingTimerBar() {
  const { state, pause } = useTimer()
  const pathname = usePathname()

  // Only show when timer is running and not on the timer page itself
  if (!state.running || pathname === '/timer') return null

  const mins = Math.floor(state.secondsLeft / 60).toString().padStart(2, '0')
  const secs = (state.secondsLeft % 60).toString().padStart(2, '0')
  const total = state.phase === 'focus' ? state.focusMins * 60 : state.breakMins * 60
  const progress = ((total - state.secondsLeft) / total) * 100
  const isFocus = state.phase === 'focus'

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3
      bg-white border border-gray-200 shadow-md rounded-b-2xl px-4 py-2">

      {/* Circular progress ring */}
      <div className="relative w-8 h-8 shrink-0">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="13" fill="none"
            stroke={isFocus ? '#374151' : '#9ca3af'}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        {/* Inner label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] font-bold text-gray-500">
            {isFocus ? 'F' : 'B'}
          </span>
        </div>
      </div>

      {/* Timer display */}
      <div>
        <div className="text-sm font-mono font-bold tabular-nums text-gray-800">
          {mins}:{secs}
        </div>
        <div className="text-xs text-gray-400 leading-none">
          {state.category
            ? state.category.split('/')[0].trim()
            : isFocus ? 'Focus' : 'Break'}
        </div>
      </div>

      {/* Pause button */}
      <button
        onClick={pause}
        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
        aria-label="Pause timer"
      >
        <IconPause size={14} strokeWidth={2} />
      </button>

      {/* Go to timer page */}
      <Link href="/timer" className="p-1.5 text-gray-400 hover:text-gray-600 transition" aria-label="Open timer">
        <IconExternalLink size={14} strokeWidth={2} />
      </Link>
    </div>
  )
}
