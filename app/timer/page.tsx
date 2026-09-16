'use client'

import { useEffect, useState, useRef } from 'react'
import { useTimer } from '@/components/TimerContext'
import Link from 'next/link'

const TASK_CATEGORIES = [
  'DSA / Algorithms', 'Web Development', 'System Design', 'Machine Learning / AI',
  'Database / SQL', 'DevOps / Cloud', 'Mobile Development', 'Open Source',
  'Project Work', 'Interview Prep', 'Reading / Research', 'Other',
]

const FOCUS_PRESETS = [15, 20, 25, 30, 45, 50, 60, 90]
const BREAK_PRESETS = [5, 10, 15, 20]

interface PointRecord {
  _id: string; date: string; points: number; sessions: number; totalFocusMinutes: number; category: string
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(19,27,46,0.7)',
  border: '1px solid rgba(51,65,85,0.4)',
  borderRadius: '0.75rem',
  padding: '1.25rem',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.6)',
  color: '#dfe2ee', borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
  fontSize: '0.875rem', width: '100%', outline: 'none',
}

/** Small tooltip wrapper — shows `tip` on hover above the trigger */
function Tip({ tip, children }: { tip: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex items-center" style={{ cursor: 'help' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 text-left rounded-lg px-3 py-2 text-[11px] leading-snug shadow-xl pointer-events-none"
          style={{ background: 'rgba(10,14,22,0.97)', border: '1px solid rgba(73,68,84,0.6)', color: '#cbc3d7' }}>
          {tip}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(73,68,84,0.6)' }} />
        </span>
      )}
    </span>
  )
}

function CalendarHeatmap({ records }: { records: PointRecord[] }) {
  const today = new Date()
  const days: { date: string; points: number }[] = []
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayPoints = records.filter(r => r.date === dateStr).reduce((s, r) => s + r.points, 0)
    days.push({ date: dateStr, points: dayPoints })
  }
  const maxPts = Math.max(...days.map(d => d.points), 1)
  function getColor(pts: number) {
    if (pts === 0) return 'rgba(73,68,84,0.3)'
    const pct = pts / maxPts
    if (pct < 0.25) return 'rgba(139,92,246,0.25)'
    if (pct < 0.5)  return 'rgba(139,92,246,0.5)'
    if (pct < 0.75) return 'rgba(139,92,246,0.75)'
    return '#8B5CF6'
  }
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const firstDayOfWeek = new Date(days[0].date).getDay()
  return (
    <div>
      <div className="flex gap-0.5 mb-1">
        {weekDays.map((d, i) => (
          <div key={i} className="w-7 text-center font-mono text-[10px]" style={{ color: '#958ea0' }}>{d}</div>
        ))}
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} className="w-7 h-7" />)}
        {days.map(day => (
          <Link key={day.date} href={`/sessions?date=${day.date}`}
            title={`${day.date}: ${day.points} pts — click to view sessions`}
            className="w-7 h-7 rounded-md transition-all hover:ring-2 hover:ring-purple-400"
            style={{ background: getColor(day.points), display: 'block' }} />
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="font-mono text-[10px]" style={{ color: '#958ea0' }}>Less</span>
        {['rgba(73,68,84,0.3)', 'rgba(139,92,246,0.25)', 'rgba(139,92,246,0.5)', 'rgba(139,92,246,0.75)', '#8B5CF6'].map((c, i) => (
          <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ background: c }} />
        ))}
        <span className="font-mono text-[10px]" style={{ color: '#958ea0' }}>More</span>
      </div>
    </div>
  )
}

export default function TimerPage() {
  const { state, start, pause, reset, setFocusMins, setBreakMins, setCategory, completedUninterrupted, clearCompleted } = useTimer()
  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied'>('default')
  const [pointRecords, setPointRecords] = useState<PointRecord[]>([])
  const [newPoints, setNewPoints] = useState(0)
  const [showNewPoints, setShowNewPoints] = useState(false)
  const celebrateTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') setNotifStatus(Notification.permission as 'default' | 'granted' | 'denied')
    loadPoints()
  }, [])

  async function loadPoints() {
    const res = await fetch('/api/timer-points')
    if (res.ok) setPointRecords(await res.json())
  }

  useEffect(() => {
    if (completedUninterrupted) {
      const pts = Math.floor(state.focusMins / 5) + (state.focusMins >= 25 ? 2 : 0) + (state.focusMins >= 50 ? 3 : 0)
      setNewPoints(pts); setShowNewPoints(true); clearCompleted()

      // Award XP points
      fetch('/api/timer-points', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusMinutes: state.focusMins, category: state.category }),
      }).then(() => loadPoints())

      // Auto-log to unified StudySession (source: timer-auto) — replaces the old /api/focus-logs call
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      fetch('/api/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: state.category || 'Pomodoro Session',
          date: today,
          focusedMinutes: state.focusMins,
          distractedMinutes: 0,
          notes: 'Auto-logged from Pomodoro timer — uninterrupted',
          source: 'timer-auto',
        }),
      })

      if (celebrateTimeout.current) clearTimeout(celebrateTimeout.current)
      celebrateTimeout.current = setTimeout(() => setShowNewPoints(false), 4000)
    }
  }, [completedUninterrupted])

  async function handleEnableAlerts() {
    if (!('Notification' in window)) { alert('Your browser does not support notifications.'); return }
    const result = await Notification.requestPermission()
    setNotifStatus(result as 'default' | 'granted' | 'denied')
    if (result === 'granted') new Notification('✅ Alerts enabled!', { body: 'You will be notified when each timer phase ends.' })
  }

  const totalSecs = state.phase === 'focus' ? state.focusMins * 60 : state.breakMins * 60
  const progress = ((totalSecs - state.secondsLeft) / totalSecs) * 100
  const radius = 90; const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference * (1 - progress / 100)
  const mins = Math.floor(state.secondsLeft / 60).toString().padStart(2, '0')
  const secs = (state.secondsLeft % 60).toString().padStart(2, '0')
  const totalPts = pointRecords.reduce((s, r) => s + r.points, 0)
  const isFocus = state.phase === 'focus'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: '#dfe2ee' }}>Focus Timer</h1>
        <p className="text-sm mt-1" style={{ color: '#958ea0' }}>Complete sessions without interruption to earn points. Sessions auto-log to Analyzer.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Timer Card */}
        <div style={cardStyle} className="space-y-5">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: '#dfe2ee' }}>
                {isFocus ? 'Focus Mode' : 'Break Mode'}
              </p>
              {isFocus && (
                <Tip tip="Focus Mode keeps you on task. If your browser supports it, enabling notifications will alert you when the session ends. Future versions will block distracting sites/notifications during this window.">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded cursor-help"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    BLOCKED ⓘ
                  </span>
                </Tip>
              )}
            </div>
            <button onClick={handleEnableAlerts}
              disabled={notifStatus === 'denied'}
              className="font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition"
              style={notifStatus === 'granted'
                ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', cursor: 'default' }
                : notifStatus === 'denied'
                ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', cursor: 'not-allowed' }
                : { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#7bd0ff' }}>
              {notifStatus === 'granted' ? 'Alerts On' : notifStatus === 'denied' ? 'Blocked' : 'Enable Alerts'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Task Category</label>
            <select value={state.category} onChange={e => setCategory(e.target.value)}
              disabled={state.running} style={{ ...inputStyle, opacity: state.running ? 0.6 : 1 }}>
              <option value="">Select a category...</option>
              {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Circular Timer */}
          <div className="flex justify-center">
            <div className="relative">
              <svg width="220" height="220" className="-rotate-90">
                <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(73,68,84,0.4)" strokeWidth="12" />
                <circle cx="110" cy="110" r={radius} fill="none"
                  stroke={isFocus ? '#8B5CF6' : '#10B981'} strokeWidth="12"
                  strokeDasharray={circumference} strokeDashoffset={strokeOffset}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-mono font-bold tabular-nums"
                  style={{ color: isFocus ? '#d0bcff' : '#10B981' }}>
                  {mins}:{secs}
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest mt-1"
                  style={{ color: isFocus ? '#8B5CF6' : '#10B981' }}>
                  {isFocus ? 'Focus' : 'Break'}
                </span>
                {state.sessionsCount > 0 && (
                  <span className="font-mono text-[10px] mt-1" style={{ color: '#958ea0' }}>Round {state.sessionsCount + 1}</span>
                )}
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#8B5CF6' }}>Focus Duration</p>
              <div className="flex flex-wrap gap-1.5">
                {FOCUS_PRESETS.map(m => (
                  <button key={m} onClick={() => setFocusMins(m)} disabled={state.running}
                    className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition"
                    style={state.focusMins === m
                      ? { background: '#8B5CF6', color: '#fff', border: '1px solid #8B5CF6' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)', opacity: state.running ? 0.5 : 1 }}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#10B981' }}>Break Duration</p>
              <div className="flex flex-wrap gap-1.5">
                {BREAK_PRESETS.map(m => (
                  <button key={m} onClick={() => setBreakMins(m)} disabled={state.running}
                    className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition"
                    style={state.breakMins === m
                      ? { background: '#10B981', color: '#fff', border: '1px solid #10B981' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)', opacity: state.running ? 0.5 : 1 }}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button onClick={state.running ? pause : start}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition"
              style={{ background: state.running ? 'rgba(149,142,160,0.3)' : '#8B5CF6', border: 'none', cursor: 'pointer' }}>
              {state.running ? '⏸ Pause' : '▶ Start'}
            </button>
            <button onClick={reset}
              className="px-4 py-3 rounded-xl text-sm font-bold transition"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,68,84,0.5)', color: '#cbc3d7', cursor: 'pointer' }}>
              ↺
            </button>
          </div>

          {showNewPoints && (
            <div className="rounded-xl px-4 py-3 text-center animate-bounce"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)' }}>
              <p className="text-lg font-bold" style={{ color: '#d0bcff' }}>+{newPoints} points!</p>
              <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>Uninterrupted session complete!</p>
            </div>
          )}

          {/* Points formula — moved to tooltip */}
          <div className="rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <p className="font-mono text-[10px]" style={{ color: '#cbc3d7' }}>
              <strong style={{ color: '#d0bcff' }}>Earn points</strong> by completing sessions without pausing.
            </p>
            <Tip tip="Points formula: 1 pt per 5 min of focus, +2 bonus for sessions ≥25 min, +5 bonus for sessions ≥50 min. Pausing resets the uninterrupted bonus.">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded cursor-help"
                style={{ background: 'rgba(139,92,246,0.15)', color: '#d0bcff', border: '1px solid rgba(139,92,246,0.3)' }}>
                How? ⓘ
              </span>
            </Tip>
          </div>
        </div>

        {/* Points & Calendar */}
        <div className="space-y-5">
          <div style={cardStyle}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#958ea0' }}>Your Points</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total Points', val: totalPts, color: '#d0bcff' },
                { label: 'Sessions', val: pointRecords.reduce((s, r) => s + r.sessions, 0), color: '#10B981' },
                { label: 'Focus Mins', val: pointRecords.reduce((s, r) => s + r.totalFocusMinutes, 0), color: '#7bd0ff' },
              ].map(stat => (
                <div key={stat.label} className="text-center rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(73,68,84,0.4)' }}>
                  <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: stat.color }}>{stat.val}</p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>{stat.label}</p>
                </div>
              ))}
            </div>
            {(() => {
              const lvl = totalPts < 50 ? { name: 'Beginner', icon: '🌱', color: '#958ea0' }
                : totalPts < 150 ? { name: 'Focused', icon: '🔥', color: '#F97316' }
                : totalPts < 300 ? { name: 'Productive', icon: '⚡', color: '#F59E0B' }
                : totalPts < 500 ? { name: 'Expert', icon: '🎯', color: '#7bd0ff' }
                : { name: 'Master', icon: '🏆', color: '#d0bcff' }
              return (
                <div className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(73,68,84,0.4)' }}>
                  <span className="text-xl">{lvl.icon}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: lvl.color }}>{lvl.name}</p>
                    <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>{totalPts} pts total</p>
                  </div>
                </div>
              )
            })()}
          </div>

          <div style={cardStyle}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#958ea0' }}>Focus Calendar (7 weeks)</p>
            <p className="font-mono text-[10px] mb-4" style={{ color: '#494454' }}>Click any cell to view that day's sessions</p>
            <CalendarHeatmap records={pointRecords} />
            <p className="font-mono text-[10px] mt-3" style={{ color: '#958ea0' }}>Each cell = one day. Darker violet = more focus points.</p>
          </div>

          {pointRecords.length > 0 && (
            <div style={cardStyle}>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#958ea0' }}>Recent Sessions</p>
              <div className="space-y-2">
                {pointRecords.slice(0, 5).map(r => (
                  <div key={r._id} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: '1px solid rgba(73,68,84,0.3)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#cbc3d7' }}>{r.category || 'General'}</p>
                      <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>{r.date} · {r.sessions} session(s) · {r.totalFocusMinutes} min</p>
                    </div>
                    <span className="font-mono text-sm font-bold" style={{ color: '#d0bcff' }}>+{r.points} pts</span>
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
