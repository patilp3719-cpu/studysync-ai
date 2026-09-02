'use client'

import { useEffect, useState, useCallback } from 'react'

const EVENT_TYPES = [
  { value: 'exam',       label: '📝 Exam',             color: 'bg-red-100 text-red-700 border-red-200',       accent: 'bg-red-500' },
  { value: 'interview',  label: '🎤 Interview',         color: 'bg-purple-100 text-purple-700 border-purple-200', accent: 'bg-purple-500' },
  { value: 'project',    label: '🗂️ Project Deadline',  color: 'bg-blue-100 text-blue-700 border-blue-200',    accent: 'bg-blue-500' },
  { value: 'assignment', label: '📋 Assignment',         color: 'bg-yellow-100 text-yellow-700 border-yellow-200', accent: 'bg-yellow-500' },
  { value: 'hackathon',  label: '⚡ Hackathon',          color: 'bg-orange-100 text-orange-700 border-orange-200', accent: 'bg-orange-500' },
  { value: 'release',    label: '🚀 Release / Launch',  color: 'bg-green-100 text-green-700 border-green-200', accent: 'bg-green-500' },
  { value: 'meeting',    label: '🗣️ Meeting / Review',  color: 'bg-indigo-100 text-indigo-700 border-indigo-200', accent: 'bg-indigo-500' },
  { value: 'other',      label: '📌 Other',             color: 'bg-gray-100 text-gray-700 border-gray-200',    accent: 'bg-gray-500' },
]

interface CheckStep {
  id: string
  text: string
}

interface CountdownEvent {
  _id: string
  subject: string
  examDate: string
  notes?: string
  aiChecklist?: string
  eventType?: string
  checklistDone?: boolean
  stepsDone?: string[]
}

// ── Parse AI markdown into individual trackable steps ──────────────────────────
function parseSteps(markdown: string): CheckStep[] {
  if (!markdown) return []
  const steps: CheckStep[] = []
  const lines = markdown.split('\n')
  for (const line of lines) {
    const stripped = line.trim()
    const match = stripped.match(/^\d+\.\s+(.+)/) || stripped.match(/^[-*]\s+(.+)/)
    if (match) {
      const text = match[1].replace(/\*\*/g, '').replace(/`/g, '').trim()
      if (text.length > 3) {
        steps.push({ id: `step-${steps.length}`, text })
      }
    }
  }
  return steps
}

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

// ── Countdown badge ────────────────────────────────────────────────────────────
function CountdownBadge({ days }: { days: number }) {
  if (days < 0)  return <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Passed</span>
  if (days === 0) return <span className="text-xs font-bold bg-red-600 text-white px-2.5 py-1 rounded-full animate-pulse">TODAY!</span>
  if (days <= 3) return <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">{days}d left 🔴</span>
  if (days <= 7) return <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">{days}d left ⚠️</span>
  return <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">{days}d left ✅</span>
}

// ── Circular progress SVG ──────────────────────────────────────────────────────
function CircularProgress({ done, total }: { done: number; total: number }) {
  if (total === 0) return null
  const pct = done / total
  const r = 18
  const circ = 2 * Math.PI * r
  const strokeDash = circ * pct
  const color = pct === 1 ? '#10b981' : pct >= 0.5 ? '#8b5cf6' : '#6366f1'
  return (
    <div className="flex items-center gap-2">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${strokeDash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.4s ease' }} />
      </svg>
      <div className="leading-tight">
        <p className="text-sm font-bold text-gray-800">{done}/{total}</p>
        <p className="text-xs text-gray-400">steps done</p>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CountdownPage() {
  const [events, setEvents] = useState<CountdownEvent[]>([])
  const [subject, setSubject] = useState('')
  const [examDate, setExamDate] = useState('')
  const [notes, setNotes] = useState('')
  const [eventType, setEventType] = useState('exam')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingChecklist, setEditingChecklist] = useState<string | null>(null)
  const [editChecklistContent, setEditChecklistContent] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [savingStep, setSavingStep] = useState<string | null>(null)   // eventId being saved

  const loadEvents = useCallback(async () => {
    const res = await fetch('/api/exams')
    if (res.ok) setEvents(await res.json())
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setLoading(true)
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, examDate, notes, eventType }),
    })
    setLoading(false)
    if (res.ok) {
      setSubject(''); setExamDate(''); setNotes(''); setEventType('exam')
      setShowForm(false)
      loadEvents()
    } else {
      const d = await res.json()
      setFormError(d.error || 'Failed to add event')
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/exams/${id}`, { method: 'DELETE' })
    if (expanded === id) setExpanded(null)
    loadEvents()
  }

  // ── Toggle a single step checkbox ────────────────────────────────────────────
  async function handleToggleStep(event: CountdownEvent, stepId: string) {
    const current = event.stepsDone || []
    const updated = current.includes(stepId)
      ? current.filter(s => s !== stepId)
      : [...current, stepId]

    const steps = parseSteps(event.aiChecklist || '')
    const allDone = steps.length > 0 && updated.length === steps.length

    // Optimistic update
    setEvents(prev => prev.map(ev =>
      ev._id === event._id
        ? { ...ev, stepsDone: updated, checklistDone: allDone }
        : ev
    ))
    setSavingStep(event._id)
    await fetch(`/api/exams/${event._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepsDone: updated, checklistDone: allDone }),
    })
    setSavingStep(null)
  }

  // ── Mark all done / clear all ─────────────────────────────────────────────────
  async function handleMarkAllDone(event: CountdownEvent, allSteps: CheckStep[]) {
    const allIds = allSteps.map(s => s.id)
    const allDone = (event.stepsDone || []).length === allSteps.length
    const updated = allDone ? [] : allIds

    setEvents(prev => prev.map(ev =>
      ev._id === event._id
        ? { ...ev, stepsDone: updated, checklistDone: !allDone }
        : ev
    ))
    await fetch(`/api/exams/${event._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepsDone: updated, checklistDone: !allDone }),
    })
  }

  async function handleUpdateChecklist(id: string) {
    await fetch(`/api/exams/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiChecklist: editChecklistContent, stepsDone: [] }),
    })
    setEditingChecklist(null)
    loadEvents()
  }

  const upcoming = events.filter(e => daysUntil(e.examDate) >= 0)
  const filtered = filterType === 'all' ? events : events.filter(e => (e.eventType || 'exam') === filterType)
  const getTypeConfig = (type: string) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1]

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📅 Countdown Board</h1>
          <p className="text-sm text-gray-500 mt-1">Track exams, interviews & deadlines with AI prep plans. Check off steps as you go.</p>
        </div>
        <div className="flex items-center gap-2">
          {upcoming.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full">
              {upcoming.length} upcoming
            </span>
          )}
          <button onClick={() => setShowForm(v => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
              showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
            {showForm ? '✕ Hide Form' : '+ Add Event'}
          </button>
        </div>
      </div>

      {/* ── Add Form ── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">New Countdown Event</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Event Type *</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Event Title / Subject *</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
                  placeholder="e.g. System Design Interview at Google"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date *</label>
                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes (optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. LeetCode hard, system design focus"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            {formError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? '🤖 Generating AI prep checklist...' : '+ Add Event & Generate AI Checklist'}
            </button>
          </form>
        </div>
      )}

      {/* ── Filter tabs ── */}
      {events.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            All ({events.length})
          </button>
          {EVENT_TYPES.filter(t => events.some(e => (e.eventType || 'exam') === t.value)).map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                filterType === t.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Event Cards ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-2xl">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-gray-500 text-sm">No events added yet.</p>
          <p className="text-gray-400 text-xs mt-1">Add any upcoming event — exam, interview, deadline — and get an AI prep plan.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map(event => {
            const days = daysUntil(event.examDate)
            const isExpanded = expanded === event._id
            const isEditing = editingChecklist === event._id
            const typeConfig = getTypeConfig(event.eventType || 'exam')
            const steps = parseSteps(event.aiChecklist || '')
            const stepsDone = event.stepsDone || []
            const doneCount = steps.filter(s => stepsDone.includes(s.id)).length
            const totalCount = steps.length
            const allDone = totalCount > 0 && doneCount === totalCount
            const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
            const isUrgent = days >= 0 && days <= 3

            return (
              <div key={event._id}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-all
                  ${allDone ? 'border-green-300' : isUrgent ? 'border-red-200' : 'border-gray-200'}`}>

                {/* ── Card header ── */}
                <div className="px-5 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                    {/* Days countdown box */}
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white font-bold shrink-0
                      ${days < 0 ? 'bg-gray-400' : days <= 3 ? 'bg-red-500' : days <= 7 ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                      <span className="text-xl leading-none">{Math.max(0, days)}</span>
                      <span className="text-[10px] font-normal opacity-90">days</span>
                    </div>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-gray-900 text-base">{event.subject}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        {allDone && (
                          <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            🎉 Plan Complete!
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(event.examDate).toLocaleDateString('en-IN', {
                          weekday: 'short', month: 'short', day: 'numeric',
                          year: 'numeric', timeZone: 'Asia/Kolkata'
                        })}
                      </p>
                      {event.notes && <p className="text-xs text-gray-400 mt-0.5 italic">"{event.notes}"</p>}
                      <div className="mt-1.5"><CountdownBadge days={days} /></div>
                    </div>

                    {/* Progress ring + action buttons */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      {totalCount > 0 && <CircularProgress done={doneCount} total={totalCount} />}
                      <div className="flex gap-2 flex-wrap">
                        {event.aiChecklist && (
                          <button
                            onClick={() => setExpanded(isExpanded ? null : event._id)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                              isExpanded
                                ? 'bg-purple-100 text-purple-700 border-purple-300'
                                : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
                            }`}>
                            {isExpanded ? '▲ Hide' : '📋 AI Plan'}
                          </button>
                        )}
                        <button onClick={() => handleDelete(event._id)}
                          className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar (shown always if steps exist) */}
                  {totalCount > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">{doneCount} of {totalCount} prep steps done</span>
                        <span className={`text-xs font-bold ${allDone ? 'text-green-600' : 'text-purple-600'}`}>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-purple-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Expanded: AI prep plan with checkboxes ── */}
                {isExpanded && event.aiChecklist && (
                  <div className="border-t border-gray-100">

                    {/* Plan header bar */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 py-3 flex items-center justify-between border-b border-purple-100">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🤖</span>
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-widest">AI Prep Plan</p>
                        {savingStep === event._id && (
                          <span className="text-xs text-purple-400 animate-pulse">saving...</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {totalCount > 0 && !isEditing && (
                          <button
                            onClick={() => handleMarkAllDone(event, steps)}
                            className={`text-xs px-3 py-1 rounded-lg border font-semibold transition ${
                              allDone
                                ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-white'
                                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            }`}>
                            {allDone ? '↺ Clear All' : '✓ Mark All Done'}
                          </button>
                        )}
                        {!isEditing && (
                          <button
                            onClick={() => { setEditingChecklist(event._id); setEditChecklistContent(event.aiChecklist || '') }}
                            className="text-xs border border-purple-200 text-purple-600 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition">
                            ✏️ Edit
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Edit mode */}
                    {isEditing ? (
                      <div className="bg-purple-50 px-5 py-4 space-y-3">
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Edit Plan (Markdown)</p>
                        <textarea
                          value={editChecklistContent}
                          onChange={e => setEditChecklistContent(e.target.value)}
                          rows={12}
                          className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y"
                        />
                        <p className="text-xs text-gray-400">
                          ⚠️ Editing will reset all checkbox progress for this plan.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateChecklist(event._id)}
                            className="text-xs bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 transition font-semibold">
                            ✓ Save Changes
                          </button>
                          <button onClick={() => setEditingChecklist(null)}
                            className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Checkbox list */
                      <div className="px-5 py-4 space-y-2">
                        {steps.length === 0 ? (
                          /* Fallback: no numbered steps found, render markdown */
                          <div className="prose prose-sm max-w-none text-gray-700">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                              {event.aiChecklist}
                            </pre>
                          </div>
                        ) : (
                          <>
                            {/* All done banner */}
                            {allDone && (
                              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-3">
                                <span className="text-2xl">🎉</span>
                                <div>
                                  <p className="text-sm font-bold text-green-800">All prep steps completed!</p>
                                  <p className="text-xs text-green-600 mt-0.5">You're fully prepared. Good luck! 💪</p>
                                </div>
                              </div>
                            )}

                            {steps.map((step, idx) => {
                              const isDone = stepsDone.includes(step.id)
                              return (
                                <label
                                  key={step.id}
                                  className={`flex items-start gap-3 cursor-pointer group rounded-xl px-4 py-3 border transition-all
                                    ${isDone
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                    }`}
                                >
                                  {/* Custom checkbox */}
                                  <div className="relative mt-0.5 shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={isDone}
                                      onChange={() => handleToggleStep(event, step.id)}
                                      className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                                      ${isDone
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-300 bg-white group-hover:border-purple-400'
                                      }`}>
                                      {isDone && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>

                                  {/* Step number + text */}
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <span className={`text-xs font-bold shrink-0 mt-0.5 w-5 text-right
                                      ${isDone ? 'text-green-500' : 'text-purple-400'}`}>
                                      {idx + 1}.
                                    </span>
                                    <span className={`text-sm leading-snug transition-all
                                      ${isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                      {step.text}
                                    </span>
                                  </div>

                                  {/* Done tag */}
                                  {isDone && (
                                    <span className="text-xs font-semibold text-green-600 shrink-0 bg-green-100 px-2 py-0.5 rounded-full">
                                      Done ✓
                                    </span>
                                  )}
                                </label>
                              )
                            })}

                            {/* Encouragement footer */}
                            {doneCount > 0 && !allDone && (
                              <div className="mt-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                <span className="text-base">🔥</span>
                                <p className="text-xs text-purple-700 font-medium">
                                  {doneCount} of {totalCount} done — keep going, you're {pct}% prepared!
                                </p>
                              </div>
                            )}
                            {doneCount === 0 && (
                              <div className="mt-2 px-1">
                                <p className="text-xs text-gray-400">
                                  💡 Check off each day as you complete your prep. Progress saves automatically.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
