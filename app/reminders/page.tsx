'use client'

import { useEffect, useState, useRef } from 'react'

const REMINDER_TYPES = [
  { value: 'task', label: 'Task' },
  { value: 'exam', label: 'Exam / Event' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'custom', label: 'Custom' },
]

const QUICK_DAYS = [
  { label: 'Today', offset: 0 }, { label: 'Tomorrow', offset: 1 },
  { label: 'In 2 days', offset: 2 }, { label: 'In 3 days', offset: 3 }, { label: 'In 1 week', offset: 7 },
]

interface Reminder { _id: string; title: string; description?: string; remindAt: string; type: string; done: boolean }

function getISTDateTimeLocal(offsetDays = 0): string {
  const d = new Date(); d.setDate(d.getDate() + offsetDays)
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

const cardStyle: React.CSSProperties = { background: 'rgba(19,27,46,0.7)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: '0.75rem', padding: '1.25rem' }
const inputStyle: React.CSSProperties = { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.6)', color: '#dfe2ee', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', outline: 'none' }
const btnBase: React.CSSProperties = { cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', borderRadius: '0.5rem', padding: '0.5rem 1rem', transition: 'all 0.15s', border: 'none' }

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
    if (typeof window !== 'undefined') setNotifGranted(Notification.permission === 'granted')
    loadReminders()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => { checkDueReminders() }, 30000)
    return () => clearInterval(interval)
  }, [reminders])

  function checkDueReminders() {
    if (Notification.permission !== 'granted') return
    const now = Date.now()
    reminders.forEach(r => {
      if (r.done) return
      const diff = new Date(r.remindAt).getTime() - now
      if (diff >= 0 && diff < 60000) {
        setAlarmActive(r._id)
        try {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CHECK_REMINDERS', reminders })
          } else {
            new Notification(`🔔 ${r.title}`, { body: r.description || 'Reminder is due now!', tag: `reminder-${r._id}`, requireInteraction: true })
          }
        } catch {}
        if (alarmRef.current) clearTimeout(alarmRef.current)
        alarmRef.current = setTimeout(() => setAlarmActive(null), 10000)
      }
    })
  }

  async function loadReminders() { const res = await fetch('/api/reminders'); if (res.ok) setReminders(await res.json()) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setFormError('')
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, remindAt, type }),
      })
      if (res.ok) {
        setTitle(''); setDescription(''); setRemindAt(getISTDateTimeLocal(0)); setType('custom')
        setShowForm(false); loadReminders()
      } else {
        let errorMsg = 'Failed to add reminder'
        try { const d = await res.json(); errorMsg = d.error || errorMsg } catch { errorMsg = res.statusText || `Server error (${res.status})` }
        setFormError(errorMsg)
      }
    } catch { setFormError('Network error — please check your connection.') }
  }

  async function handleToggle(id: string) { await fetch(`/api/reminders/${id}`, { method: 'PATCH' }); loadReminders() }
  async function handleDelete(id: string) { await fetch(`/api/reminders/${id}`, { method: 'DELETE' }); loadReminders() }
  async function handleEnableNotifs() { const granted = await requestNotifPermission(); setNotifGranted(granted); if (granted) registerServiceWorker() }
  function applyQuickDay(offset: number) { setRemindAt(getISTDateTimeLocal(offset)) }

  const filtered = reminders.filter(r => filter === 'all' ? true : filter === 'pending' ? !r.done : r.done)
  const overdueCount = reminders.filter(r => !r.done && new Date(r.remindAt) < new Date()).length
  const upcomingCount = reminders.filter(r => !r.done && new Date(r.remindAt) >= new Date()).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#dfe2ee' }}>Reminders & Alarms</h1>
          <p className="text-sm mt-1" style={{ color: '#958ea0' }}>Set real-time alarms for any task, event or deadline.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification toggle switch */}
          <button onClick={notifGranted ? undefined : handleEnableNotifs}
            title={notifGranted ? 'Notifications are on' : 'Click to enable notifications'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-mono text-[10px] font-bold uppercase tracking-widest"
            style={notifGranted
              ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', cursor: 'default' }
              : { background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', color: '#7bd0ff', cursor: 'pointer' }}>
            {/* Toggle pill */}
            <span className="relative inline-flex w-8 h-4 rounded-full transition-colors shrink-0"
              style={{ background: notifGranted ? '#10B981' : 'rgba(73,68,84,0.5)' }}>
              <span className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform"
                style={{ transform: notifGranted ? 'translateX(16px)' : 'translateX(0)' }} />
            </span>
            {notifGranted ? 'Alerts On' : 'Alerts Off'}
          </button>
          <button onClick={() => setShowForm(v => !v)}
            style={{ ...btnBase, background: showForm ? 'rgba(255,255,255,0.07)' : '#8B5CF6', color: showForm ? '#cbc3d7' : '#fff' }}>
            {showForm ? '✕ Cancel' : '+ Add Reminder'}
          </button>
        </div>
      </div>

      {/* Alarm banner */}
      {alarmActive && (
        <div className="rounded-xl px-5 py-4 flex items-center gap-3 animate-pulse"
          style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.5)' }}>
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: '#EF4444' }}>
              ALARM: {reminders.find(r => r._id === alarmActive)?.title}
            </p>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>Your reminder is due right now!</p>
          </div>
          <button onClick={() => { setAlarmActive(null); handleToggle(alarmActive) }}
            style={{ ...btnBase, background: '#EF4444', color: '#fff', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
            ✓ Dismiss
          </button>
        </div>
      )}

      {/* Overdue alert */}
      {overdueCount > 0 && !alarmActive && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span style={{ color: '#EF4444' }}>⚠️</span>
          <p className="text-sm font-medium" style={{ color: '#ffb4ab' }}>
            {overdueCount} overdue reminder{overdueCount > 1 ? 's' : ''} — check your pending list!
          </p>
        </div>
      )}

      {/* Stats */}
      {reminders.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Upcoming', val: upcomingCount, color: '#F59E0B' },
            { label: 'Overdue', val: overdueCount, color: '#EF4444' },
            { label: 'Done', val: reminders.filter(r => r.done).length, color: '#10B981' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(73,68,84,0.4)' }}>
              <p className="text-xl font-bold font-mono tabular-nums" style={{ color: stat.color }}>{stat.val}</p>
              <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div style={cardStyle}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#958ea0' }}>New Reminder / Alarm</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder="e.g. Submit assignment, Standup meeting" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Type</label>
                <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
                  {REMINDER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Description (optional)</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Add details about this reminder..." style={inputStyle} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#958ea0' }}>Quick Day</label>
              <div className="flex flex-wrap gap-2">
                {QUICK_DAYS.map(d => (
                  <button key={d.label} type="button" onClick={() => applyQuickDay(d.offset)}
                    className="font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)' }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Alarm Date & Time (IST) *</label>
              <input type="datetime-local" value={remindAt} onChange={e => setRemindAt(e.target.value)} required style={inputStyle} />
              <p className="font-mono text-[10px] mt-1" style={{ color: '#958ea0' }}>
                {remindAt ? new Date(remindAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>

            {formError && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ffb4ab', border: '1px solid rgba(239,68,68,0.3)' }}>{formError}</p>}

            {!notifGranted && (
              <div className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <p className="font-mono text-[10px]" style={{ color: '#F59E0B' }}>
                  Enable notifications above to receive alarm alerts even when the app is in background.
                </p>
              </div>
            )}

            <button type="submit" style={{ ...btnBase, background: '#8B5CF6', color: '#fff', width: '100%', padding: '0.625rem' }}>
              Set Alarm ⏰
            </button>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {(['pending', 'all', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition"
            style={filter === f
              ? { background: '#8B5CF6', color: '#fff', border: 'none' }
              : { background: 'rgba(255,255,255,0.05)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)' }}>
            {f === 'pending' ? 'Pending' : f === 'done' ? 'Done' : 'All'}
          </button>
        ))}
        <span className="ml-auto font-mono text-[10px]" style={{ color: '#958ea0' }}>
          {filtered.length} reminder{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Reminder List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed rgba(73,68,84,0.5)' }}>
          <p className="text-2xl mb-2">🔔</p>
          <p className="text-sm" style={{ color: '#958ea0' }}>No reminders here.</p>
          {reminders.length === 0 && (
            <p className="text-xs mt-1" style={{ color: '#494454' }}>Tap "+ Add Reminder" to set your first alarm.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const isOverdue = !r.done && new Date(r.remindAt) < new Date()
            const isAlarm = alarmActive === r._id
            return (
              <div key={r._id} className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition"
                style={{
                  ...cardStyle, padding: '1rem',
                  opacity: r.done ? 0.5 : 1,
                  borderColor: isAlarm ? 'rgba(239,68,68,0.6)' : isOverdue ? 'rgba(239,68,68,0.4)' : 'rgba(51,65,85,0.4)',
                  background: isAlarm ? 'rgba(239,68,68,0.1)' : 'rgba(19,27,46,0.7)',
                }}>
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggle(r._id)}
                    className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition"
                    style={r.done
                      ? { background: '#10B981', borderColor: '#10B981' }
                      : { borderColor: 'rgba(73,68,84,0.8)', background: 'transparent' }}>
                    {r.done && <span className="text-[9px] font-bold" style={{ color: '#fff' }}>✓</span>}
                  </button>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: r.done ? '#958ea0' : '#dfe2ee', textDecoration: r.done ? 'line-through' : 'none' }}>
                      {r.title}
                    </p>
                    {r.description && <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>{r.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ background: 'rgba(73,68,84,0.4)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.4)' }}>
                        {REMINDER_TYPES.find(x => x.value === r.type)?.label || 'Custom'}
                      </span>
                      <span className="font-mono text-[10px]" style={{ color: isOverdue ? '#EF4444' : '#958ea0' }}>
                        {new Date(r.remindAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: isOverdue ? '#EF4444' : '#8B5CF6' }}>
                        {isOverdue ? 'Overdue' : timeUntil(r.remindAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleToggle(r._id)}
                    style={r.done
                      ? { ...btnBase, background: 'rgba(255,255,255,0.05)', color: '#958ea0', border: '1px solid rgba(73,68,84,0.5)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }
                      : { ...btnBase, background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                    {r.done ? '↺ Undo' : '✓ Done'}
                  </button>
                  <button onClick={() => handleDelete(r._id)}
                    style={{ ...btnBase, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <span style={{ color: '#7bd0ff' }} className="shrink-0">💡</span>
        <div className="font-mono text-[10px] space-y-1" style={{ color: '#7bd0ff' }}>
          <p><strong>Background notifications:</strong> Click "Enable Alerts" to register a service worker. Reminders will notify you even when the browser tab is closed.</p>
          <p>The app checks every 30 seconds while open.</p>
        </div>
      </div>
    </div>
  )
}
