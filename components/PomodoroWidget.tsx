'use client'

import { useEffect, useRef, useState } from 'react'

type Phase = 'focus' | 'break'

export default function PomodoroWidget() {
  const [focusMins, setFocusMins] = useState(25)
  const [breakMins, setBreakMins] = useState(5)
  const [subject, setSubject] = useState('')
  const [phase, setPhase] = useState<Phase>('focus')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessionsCount, setSessions] = useState(0)
  const [totalFocused, setTotalFocused] = useState(0)
  const [totalDistracted, setTotalDistracted] = useState(0)
  const [saved, setSaved] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            handlePhaseEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  function handlePhaseEnd() {
    if (phase === 'focus') {
      setTotalFocused(p => p + focusMins)
      setSessions(p => p + 1)
      setPhase('break')
      setSecondsLeft(breakMins * 60)
      if (Notification.permission === 'granted') {
        new Notification('🍅 Focus session done!', { body: `Take a ${breakMins}-min break. Well done!` })
      }
    } else {
      setTotalDistracted(p => p + breakMins)
      setPhase('focus')
      setSecondsLeft(focusMins * 60)
      if (Notification.permission === 'granted') {
        new Notification('⏰ Break over!', { body: 'Time to focus again.' })
      }
    }
  }

  async function handleSaveLog() {
    if (!subject) return alert('Please enter a subject before saving.')
    const today = new Date().toISOString().split('T')[0]
    await fetch('/api/focus-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        subject,
        focusedMinutes: totalFocused,
        distractedMinutes: totalDistracted,
        notes: `Auto-logged from Pomodoro — ${sessionsCount} session(s)`,
      }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const secs = (secondsLeft % 60).toString().padStart(2, '0')
  const phaseFull = focusMins * 60
  const progress = phase === 'focus'
    ? ((phaseFull - secondsLeft) / phaseFull) * 100
    : (((breakMins * 60) - secondsLeft) / (breakMins * 60)) * 100

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-800">🍅 Pomodoro Timer</h2>
          <p className="text-xs text-gray-400">Focus sessions auto-log to your Analyzer</p>
        </div>
        <button onClick={requestNotificationPermission}
          className="text-xs text-blue-500 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50">
          🔔 Enable Alerts
        </button>
      </div>

      {/* Subject */}
      <input type="text" placeholder="Subject (e.g. Mathematics)" value={subject}
        onChange={e => setSubject(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />

      {/* Timer settings */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <p className="text-xs text-orange-600 font-semibold mb-1">Focus (min)</p>
          <input type="number" min={1} max={90} value={focusMins}
            onChange={e => { setFocusMins(+e.target.value); if (!running && phase === 'focus') setSecondsLeft(+e.target.value * 60) }}
            className="w-full text-center border border-orange-200 rounded-md px-2 py-1 text-sm font-bold" />
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600 font-semibold mb-1">Break (min)</p>
          <input type="number" min={1} max={30} value={breakMins}
            onChange={e => { setBreakMins(+e.target.value); if (!running && phase === 'break') setSecondsLeft(+e.target.value * 60) }}
            className="w-full text-center border border-green-200 rounded-md px-2 py-1 text-sm font-bold" />
        </div>
      </div>

      {/* Timer display */}
      <div className="text-center space-y-3">
        <div className={`text-5xl font-mono font-bold ${phase === 'focus' ? 'text-orange-500' : 'text-green-500'}`}>
          {mins}:{secs}
        </div>
        <div className={`text-xs font-semibold uppercase tracking-widest ${phase === 'focus' ? 'text-orange-400' : 'text-green-400'}`}>
          {phase === 'focus' ? '🎯 Focus Phase' : '☕ Break Phase'}
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${phase === 'focus' ? 'bg-orange-400' : 'bg-green-400'}`}
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button onClick={() => setRunning(r => !r)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition ${running ? 'bg-gray-500 hover:bg-gray-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
          {running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button onClick={() => { setRunning(false); setSecondsLeft(focusMins * 60); setPhase('focus') }}
          className="px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50">
          ↺ Reset
        </button>
      </div>

      {/* Stats */}
      {sessionsCount > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Session Stats</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-lg font-bold text-orange-500">{sessionsCount}</p><p className="text-xs text-gray-400">sessions</p></div>
            <div><p className="text-lg font-bold text-green-600">{totalFocused}</p><p className="text-xs text-gray-400">focused min</p></div>
            <div><p className="text-lg font-bold text-blue-500">{totalDistracted}</p><p className="text-xs text-gray-400">break min</p></div>
          </div>
          <button onClick={handleSaveLog}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition ${saved ? 'bg-green-100 text-green-700' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
            {saved ? '✅ Saved to Analyzer!' : '💾 Save to Focus Analyzer'}
          </button>
        </div>
      )}
    </div>
  )
}
