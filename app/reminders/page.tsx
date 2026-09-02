'use client'

import { useEffect, useState, useRef } from 'react'

const REMINDER_TYPES = [
  { value: 'task', label: '📋 Task', color: 'bg-blue-100 text-blue-700' },
  { value: 'exam', label: '📝 Exam / Event', color: 'bg-red-100 text-red-700' },
  { value: 'meeting', label: '🗣️ Meeting', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'deadline', label: '⏰ Deadline', color: 'bg-orange-100 text-orange-700' },
  { value: 'custom', label: '🔔 Custom', color: 'bg-purple-100 text-purple-700' },
]

const QUICK_DAYS = [
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
  { label: 'In 2 days', offset: 2 },
  { label: 'In 3 days', offset: 3 },
  { label: 'In 1 week', offset: 7 },
]

interface Reminder {
  _id: string
  title: string
  description?: string
  remindAt: string
  type: string
  done: boolean
}

function getISTDateTimeLocal(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${ist.getFullYear()}-${pad(ist.getMonth() + 1)}-${pad(ist.getDate())}T${pad(ist.getHours())}:${pad(ist.getMinutes())}`
}

function timeUntil(remindAt: string): string {
  const diff = new Date(remindAt).getTime() - Date.now()
  if (diff < 0) return 'Overdue'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'in < 1m'
  if (mins < 60) return `in ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `in ${hrs}h ${mins % 60}m`
  return `in ${Math.floor(hrs / 24)}d`
}

function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
}

async function requestNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [remindAt, setRemindAt] = useState(getISTDateTimeLocal(0))
  const [type, setType] = useState('custom')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending')
  const [notifGranted, setNotifGranted] = useState(false)
  const [alarmActive, setAlarmActive] = useState<string | null>(null)
  const alarmRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    registerServiceWorker()
    if (typeof window !== 'undefined') {
      setNotifGranted(Notification.permission === 'granted')
    }
    loadReminders()
  }, [])

  // Poll every 30 seconds for due reminders
  useEffect(() => {
    const interval = setInterval(() => {
      checkDueReminders()
    }, 30000)
    return () => clearInterval(interval)
  }, [reminders])

  function checkDueReminders() {
    if (Notification.permission !== 'granted') return
    const now = Date.now()
    reminders.forEach(r => {
      if (r.done) return
      const due = new Date(r.remindAt).getTime()
      const diff = due - now
      if (diff >= 0 && diff < 60000) {
        // Fire alarm
        setAlarmActive(r._id)
        try {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CHECK_REMINDERS',
              reminders,
            })
          } else {
            new Notification(`🔔 ${r.title}`, {
              body: r.description || 'Reminder is due now!',
              tag: `reminder-${r._id}`,
              requireInteraction: true,
            })
          }
        } catch {}
        if (alarmRef.current) clearTimeout(alarmRef.current)
        alarmRef.current = setTimeout(() => setAlarmActive(null), 10000)
      }
    })
  }

  async function loadReminders() {
    const res = await fetch('/api/reminders')
    if (res.ok) setReminders(await res.json())
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, remindAt, type }),
      })
      if (res.ok) {
        setTitle(''); setDescription(''); setRemindAt(getISTDateTimeLocal(0)); setType('custom')
        setShowForm(false)
        loadReminders()
      } else {
        let errorMsg = 'Failed to add reminder'
        try {
          const d = await res.json()
          errorMsg = d.error || errorMsg
        } catch {
          errorMsg = res.statusText || `Server error (${res.status})`
        }
        setFormError(errorMsg)
      }
    } catch {
      setFormError('Network error — please check your connection and try again.')
    }
  }

  async function handleToggle(id: string) {
    await fetch(`/api/reminders/${id}`, { method: 'PATCH' })
    loadReminders()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    loadReminders()
  }

  async function handleEnableNotifs() {
    const granted = await requestNotifPermission()
    setNotifGranted(granted)
    if (granted) registerServiceWorker()
  }

  function applyQuickDay(offset: number) {
    setRemindAt(getISTDateTimeLocal(offset))
  }

  const filtered = reminders.filter(r =>
    filter === 'all' ? true : filter === 'pending' ? !r.done : r.done
  )
  const overdueCount = reminders.filter(r => !r.done && new Date(r.remindAt) < new Date()).length
  const upcomingCount = reminders.filter(r => !r.done && new Date(r.remindAt) >= new Date()).length

  const getTypeConfig = (t: string) => REMINDER_TYPES.find(x => x.value === t) || REMINDER_TYPES[REMINDER_TYPES.length - 1]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🔔 Reminders & Alarms</h1>
          <p className="text-sm text-gray-500 mt-1">Set real-time alarms for any task, event or deadline. Works even when the app is closed.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleEnableNotifs}
            className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
              notifGranted
                ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            }`}
            disabled={notifGranted}>
            {notifGranted ? '🔔 Alerts On' : '🔔 Enable Alerts'}
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
              showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}>
            {showForm ? '✕ Cancel' : '+ Add Reminder'}
          </button>
        </div>
      </div>

      {/* Alarm banner */}
      {alarmActive && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl px-5 py-4 flex items-center gap-3 animate-pulse">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="font-bold text-red-700 text-sm">
              ⏰ ALARM: {reminders.find(r => r._id === alarmActive)?.title}
            </p>
            <p className="text-xs text-red-600 mt-0.5">Your reminder is due right now!</p>
          </div>
          <button onClick={() => { setAlarmActive(null); handleToggle(alarmActive) }}
            className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition font-semibold">
            ✓ Dismiss
          </button>
        </div>
      )}

      {/* Overdue alert */}
      {overdueCount > 0 && !alarmActive && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-red-500">⚠️</span>
          <p className="text-sm text-red-700 font-medium">{overdueCount} overdue reminder{overdueCount > 1 ? 's' : ''} — check your pending list!</p>
        </div>
      )}

      {/* Stats */}
      {reminders.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-yellow-600">{upcomingCount}</p>
            <p className="text-xs text-gray-500">Upcoming</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-red-600">{overdueCount}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-green-600">{reminders.filter(r => r.done).length}</p>
            <p className="text-xs text-gray-500">Done</p>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">New Reminder / Alarm</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder="e.g. Submit assignment, Standup meeting, Interview prep"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</label>
                <select value={type} onChange={e => setType(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                  {REMINDER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description (optional)</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Add details about this reminder..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
            </div>

            {/* Quick day selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Day</label>
              <div className="flex flex-wrap gap-2">
                {QUICK_DAYS.map(d => (
                  <button key={d.label} type="button" onClick={() => applyQuickDay(d.offset)}
                    className="text-xs bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-purple-300 transition font-medium">
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Alarm Date & Time (IST) *</label>
              <input type="datetime-local" value={remindAt} onChange={e => setRemindAt(e.target.value)} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <p className="text-xs text-gray-400 mt-1">
                Selected: {remindAt ? new Date(remindAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>

            {formError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}

            {!notifGranted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <span className="text-yellow-600 text-sm">⚠️</span>
                <p className="text-xs text-yellow-700">
                  <strong>Enable notifications</strong> above to receive alarm alerts even when the app is in background.
                </p>
              </div>
            )}

            <button type="submit"
              className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
              Set Alarm ⏰
            </button>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'all', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'pending' ? '⏳ Pending' : f === 'done' ? '✅ Done' : '📋 All'}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} reminder{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Reminder List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-2xl">
          <p className="text-3xl mb-2">🔔</p>
          <p className="text-gray-500 text-sm">No reminders here.</p>
          <p className="text-gray-400 text-xs mt-1">Add one above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const isOverdue = !r.done && new Date(r.remindAt) < new Date()
            const typeConfig = getTypeConfig(r.type)
            return (
              <div key={r._id}
                className={`bg-white border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition
                  ${r.done ? 'opacity-50 border-gray-200' : isOverdue ? 'border-red-200 bg-red-50' : alarmActive === r._id ? 'border-red-400 bg-red-50 ring-2 ring-red-400' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggle(r._id)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition
                      ${r.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-purple-400'}`}>
                    {r.done && <span className="text-[10px] text-white">✓</span>}
                  </button>
                  <div>
                    <p className={`font-semibold text-sm text-gray-800 ${r.done ? 'line-through text-gray-400' : ''}`}>{r.title}</p>
                    {r.description && <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                        {new Date(r.remindAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-xs font-semibold ${isOverdue ? 'text-red-600' : 'text-purple-600'}`}>
                        {isOverdue ? '⚠️ Overdue' : timeUntil(r.remindAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleToggle(r._id)}
                    className={`text-xs border px-3 py-1.5 rounded-lg transition font-medium ${
                      r.done
                        ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}>
                    {r.done ? '↺ Undo' : '✓ Done'}
                  </button>
                  <button onClick={() => handleDelete(r._id)}
                    className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Service worker info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-blue-500 shrink-0">💡</span>
        <div className="text-xs text-blue-700 space-y-1">
          <p><strong>Background notifications:</strong> Click "Enable Alerts" to register a service worker. Reminders will notify you even when the browser tab is closed.</p>
          <p>The app checks every 30 seconds while open. For true background delivery, keep the service worker active and notifications enabled.</p>
        </div>
      </div>
    </div>
  )
}
