'use client'

import { useEffect, useState, useRef } from 'react'
import { useTimer } from '@/components/TimerContext'

const TASK_CATEGORIES = [
  'DSA / Algorithms',
  'Web Development',
  'System Design',
  'Machine Learning / AI',
  'Database / SQL',
  'DevOps / Cloud',
  'Mobile Development',
  'Open Source',
  'Project Work',
  'Interview Prep',
  'Reading / Research',
  'Other',
]

const FOCUS_PRESETS = [15, 20, 25, 30, 45, 50, 60, 90]
const BREAK_PRESETS = [5, 10, 15, 20]

interface PointRecord {
  _id: string
  date: string
  points: number
  sessions: number
  totalFocusMinutes: number
  category: string
}

function CalendarHeatmap({ records }: { records: PointRecord[] }) {
  // Show last 7 weeks (49 days)
  const today = new Date()
  const days: { date: string; points: number }[] = []
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayPoints = records.filter(r => r.date === dateStr).reduce((s, r) => s + r.points, 0)
    days.push({ date: dateStr, points: dayPoints })
  }

  const maxPts = Math.max(...days.map(d => d.points), 1)

  function getColor(pts: number) {
    if (pts === 0) return 'bg-gray-100'
    const pct = pts / maxPts
    if (pct < 0.25) return 'bg-green-200'
    if (pct < 0.5) return 'bg-green-400'
    if (pct < 0.75) return 'bg-green-600'
    return 'bg-green-700'
  }

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const firstDayOfWeek = new Date(days[0].date).getDay()

  return (
    <div>
      <div className="flex gap-0.5 mb-1">
        {weekDays.map((d, i) => (
          <div key={i} className="w-7 text-center text-xs text-gray-400 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {/* Empty cells for alignment */}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="w-7 h-7" />
        ))}
        {days.map(day => (
          <div
            key={day.date}
            title={`${day.date}: ${day.points} pts`}
            className={`w-7 h-7 rounded-md ${getColor(day.points)} transition-all cursor-default`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-xs text-gray-400">Less</span>
        {['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-700'].map(c => (
          <div key={c} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
        ))}
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  )
}

export default function TimerPage() {
  const { state, start, pause, reset, setFocusMins, setBreakMins, setCategory, completedUninterrupted, clearCompleted } = useTimer()
  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied'>('default')
  const [pointRecords, setPointRecords] = useState<PointRecord[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [newPoints, setNewPoints] = useState(0)
  const [showNewPoints, setShowNewPoints] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const celebrateTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNotifStatus(Notification.permission as 'default' | 'granted' | 'denied')
    }
    loadPoints()
  }, [])

  async function loadPoints() {
    const res = await fetch('/api/timer-points')
    if (res.ok) {
      const data: PointRecord[] = await res.json()
      setPointRecords(data)
      setTotalPoints(data.reduce((s, r) => s + r.points, 0))
    }
  }

  // When a session completes uninterrupted, log points
  useEffect(() => {
    if (completedUninterrupted) {
      const pts = Math.floor(state.focusMins / 5) + (state.focusMins >= 25 ? 2 : 0) + (state.focusMins >= 50 ? 3 : 0)
      setNewPoints(pts)
      setShowNewPoints(true)
      clearCompleted()

      // Save to DB
      fetch('/api/timer-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusMinutes: state.focusMins, category: state.category }),
      }).then(() => loadPoints())

      // Also log to focus analyzer
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      fetch('/api/focus-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          subject: state.category || 'Pomodoro Session',
          focusedMinutes: state.focusMins,
          distractedMinutes: 0,
          notes: `Auto-logged from Pomodoro timer — uninterrupted`,
        }),
      })

      if (celebrateTimeout.current) clearTimeout(celebrateTimeout.current)
      celebrateTimeout.current = setTimeout(() => setShowNewPoints(false), 4000)
    }
  }, [completedUninterrupted])

  async function handleEnableAlerts() {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications.')
      return
    }
    const result = await Notification.requestPermission()
    setNotifStatus(result as 'default' | 'granted' | 'denied')
    if (result === 'granted') {
      new Notification('✅ Alerts enabled!', { body: 'You will be notified when each timer phase ends.' })
    }
  }

  // Circular timer calculations
  const totalSecs = state.phase === 'focus' ? state.focusMins * 60 : state.breakMins * 60
  const progress = ((totalSecs - state.secondsLeft) / totalSecs) * 100
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDash = circumference
  const strokeOffset = circumference * (1 - progress / 100)
  const mins = Math.floor(state.secondsLeft / 60).toString().padStart(2, '0')
  const secs = (state.secondsLeft % 60).toString().padStart(2, '0')

  const totalPts = pointRecords.reduce((s, r) => s + r.points, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🍅 Focus Timer</h1>
        <p className="text-sm text-gray-500 mt-1">Complete sessions without interruption to earn points. Sessions auto-log to Analyzer.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* LEFT: Timer Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">

          {/* Notification button */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {state.phase === 'focus' ? '🎯 Focus Mode' : '☕ Break Mode'}
            </p>
            <button
              onClick={handleEnableAlerts}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                notifStatus === 'granted'
                  ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                  : notifStatus === 'denied'
                  ? 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
              disabled={notifStatus === 'denied'}
            >
              {notifStatus === 'granted' ? '🔔 Alerts On' : notifStatus === 'denied' ? '🔕 Blocked' : '🔔 Enable Alerts'}
            </button>
          </div>

          {/* Category selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Task Category</label>
            <select
              value={state.category}
              onChange={e => setCategory(e.target.value)}
              disabled={state.running}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-60"
            >
              <option value="">Select a category...</option>
              {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Circular Timer */}
          <div className="flex justify-center">
            <div className="relative">
              <svg width="220" height="220" className="-rotate-90">
                {/* Background circle */}
                <circle cx="110" cy="110" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="12" />
                {/* Progress circle */}
                <circle
                  cx="110" cy="110" r={radius}
                  fill="none"
                  stroke={state.phase === 'focus' ? '#f97316' : '#22c55e'}
                  strokeWidth="12"
                  strokeDasharray={strokeDash}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-mono font-bold tabular-nums ${state.phase === 'focus' ? 'text-orange-500' : 'text-green-500'}`}>
                  {mins}:{secs}
                </span>
                <span className={`text-xs font-semibold uppercase tracking-widest mt-1 ${state.phase === 'focus' ? 'text-orange-400' : 'text-green-400'}`}>
                  {state.phase === 'focus' ? 'Focus' : 'Break'}
                </span>
                {state.sessionsCount > 0 && (
                  <span className="text-xs text-gray-400 mt-1">Round {state.sessionsCount + 1}</span>
                )}
              </div>
            </div>
          </div>

          {/* Minute selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Focus Duration</p>
              <div className="flex flex-wrap gap-1.5">
                {FOCUS_PRESETS.map(m => (
                  <button key={m} onClick={() => setFocusMins(m)} disabled={state.running}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                      state.focusMins === m
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 disabled:opacity-50'
                    }`}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Break Duration</p>
              <div className="flex flex-wrap gap-1.5">
                {BREAK_PRESETS.map(m => (
                  <button key={m} onClick={() => setBreakMins(m)} disabled={state.running}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                      state.breakMins === m
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600 disabled:opacity-50'
                    }`}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={state.running ? pause : start}
              className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition ${
                state.running ? 'bg-gray-500 hover:bg-gray-600' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {state.running ? '⏸ Pause' : '▶ Start'}
            </button>
            <button onClick={reset}
              className="px-4 py-3 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 text-gray-600">
              ↺
            </button>
          </div>

          {/* Points earned notification */}
          {showNewPoints && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl px-4 py-3 text-center animate-bounce">
              <p className="text-lg font-bold text-orange-600">+{newPoints} points! 🎉</p>
              <p className="text-xs text-gray-500">Uninterrupted session complete!</p>
            </div>
          )}

          {/* Info tip */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
            <p className="text-xs text-orange-700">
              <strong>Earn points</strong> by completing sessions without pausing or stopping. Points = 1 per 5 min + bonus for 25m (×2) and 50m (×5).
            </p>
          </div>
        </div>

        {/* RIGHT: Points & Calendar */}
        <div className="space-y-5">

          {/* Points summary */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">🏆 Your Points</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center bg-orange-50 border border-orange-100 rounded-xl p-3">
                <p className="text-2xl font-bold text-orange-600">{totalPts}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Points</p>
              </div>
              <div className="text-center bg-green-50 border border-green-100 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-600">
                  {pointRecords.reduce((s, r) => s + r.sessions, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Sessions</p>
              </div>
              <div className="text-center bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-2xl font-bold text-blue-600">
                  {pointRecords.reduce((s, r) => s + r.totalFocusMinutes, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Focus Mins</p>
              </div>
            </div>

            {/* Level badge */}
            {(() => {
              const lvl = totalPts < 50 ? { name: 'Beginner', icon: '🌱', color: 'text-gray-600' }
                : totalPts < 150 ? { name: 'Focused', icon: '🔥', color: 'text-orange-600' }
                : totalPts < 300 ? { name: 'Productive', icon: '⚡', color: 'text-yellow-600' }
                : totalPts < 500 ? { name: 'Expert', icon: '🎯', color: 'text-blue-600' }
                : { name: 'Master', icon: '🏆', color: 'text-purple-600' }
              return (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <span className="text-xl">{lvl.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${lvl.color}`}>{lvl.name}</p>
                    <p className="text-xs text-gray-400">{totalPts} pts total</p>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Calendar heatmap */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">📅 Focus Calendar (7 weeks)</h2>
            <CalendarHeatmap records={pointRecords} />
            <p className="text-xs text-gray-400 mt-3">Each cell = one day. Darker green = more focus points earned.</p>
          </div>

          {/* Recent sessions */}
          {pointRecords.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Recent Sessions</h2>
              <div className="space-y-2">
                {pointRecords.slice(0, 5).map(r => (
                  <div key={r._id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{r.category || 'General'}</p>
                      <p className="text-xs text-gray-400">{r.date} · {r.sessions} session(s) · {r.totalFocusMinutes} min</p>
                    </div>
                    <span className="text-sm font-bold text-orange-500">+{r.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
