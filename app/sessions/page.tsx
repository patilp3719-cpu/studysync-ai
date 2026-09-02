'use client'

import { useEffect, useState } from 'react'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

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

interface StudySession {
  _id: string
  subject: string
  date: string
  plannedStart: string
  plannedEnd: string
  actualStart: string
  actualEnd: string
  skipped?: boolean
}

function gapMinutes(planned: string, actual: string): number {
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  return toMin(actual) - toMin(planned)
}

// A session is considered skipped if:
// 1. The `skipped` flag is explicitly true (new sessions), OR
// 2. The actual times exactly match the planned times (legacy sessions saved before the skipped field existed)
function isSessionSkipped(s: StudySession): boolean {
  if (s.skipped === true) return true
  if (
    s.actualStart === s.plannedStart &&
    s.actualEnd === s.plannedEnd
  ) return true
  return false
}

function GapBadge({ gap, skipped }: { gap: number; skipped: boolean }) {
  if (skipped) return <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">⏭ Skipped / Not done</span>
  if (gap <= 0) return <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ On time</span>
  if (gap <= 15) return <span className="inline-flex items-center gap-1 text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ {gap} min late</span>
  return <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🔴 {gap} min late</span>
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [category, setCategory] = useState(TASK_CATEGORIES[0])
  const [date, setDate] = useState('')
  const [plannedStart, setPlannedStart] = useState('')
  const [plannedEnd, setPlannedEnd] = useState('')
  const [taskDone, setTaskDone] = useState<'done' | 'skipped'>('done')
  const [actualStart, setActualStart] = useState('')
  const [actualEnd, setActualEnd] = useState('')
  const [formError, setFormError] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function loadSessions() {
    const res = await fetch('/api/sessions')
    if (res.ok) setSessions(await res.json())
  }

  useEffect(() => { loadSessions() }, [])

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const isSkipped = taskDone === 'skipped'
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: category,
        date,
        plannedStart,
        plannedEnd,
        actualStart: isSkipped ? plannedStart : actualStart,
        actualEnd: isSkipped ? plannedEnd : actualEnd,
        skipped: isSkipped,
      }),
    })
    if (res.ok) {
      setCategory(TASK_CATEGORIES[0])
      setDate(''); setPlannedStart(''); setPlannedEnd('')
      setActualStart(''); setActualEnd('')
      setTaskDone('done')
      setShowForm(false)
      loadSessions()
    } else {
      const data = await res.json()
      setFormError(data.error || 'Failed to log session')
    }
  }

  async function handleAnalyze() {
    setAiLoading(true)
    setAiError('')
    setSuggestion('')
    try {
      const res = await fetch('/api/ai/procrastination')
      const data = await res.json()
      if (res.ok) setSuggestion(data.suggestion)
      else setAiError(data.error || 'Failed to analyze')
    } catch {
      setAiError('Something went wrong. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Smart Procrastination Detector</h1>
          <p className="text-sm text-gray-500 mt-1">Log planned vs actual work times. AI detects your procrastination patterns.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition shrink-0 ${
            showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
          {showForm ? '✕ Hide Form' : '+ Log Session'}
        </button>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Log a Work Session</h2>
          <form onSubmit={handleLog} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Task Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>

            {/* Task done / skipped toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Task Status</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setTaskDone('done')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                    taskDone === 'done' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-300 hover:border-green-300'
                  }`}>
                  ✅ Task Done
                </button>
                <button type="button" onClick={() => setTaskDone('skipped')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                    taskDone === 'skipped' ? 'bg-gray-500 text-white border-gray-500' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}>
                  ⏭ Not Done / Skipped
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-3 space-y-3">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Planned</p>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start</label>
                  <input type="time" value={plannedStart} onChange={e => setPlannedStart(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End</label>
                  <input type="time" value={plannedEnd} onChange={e => setPlannedEnd(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div className={`rounded-xl p-3 space-y-3 ${taskDone === 'skipped' ? 'bg-gray-50 opacity-50 pointer-events-none' : 'bg-orange-50'}`}>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                  {taskDone === 'skipped' ? 'Actual (N/A — Skipped)' : 'Actual'}
                </p>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start</label>
                  <input type="time" value={actualStart} onChange={e => setActualStart(e.target.value)}
                    required={taskDone === 'done'}
                    disabled={taskDone === 'skipped'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End</label>
                  <input type="time" value={actualEnd} onChange={e => setActualEnd(e.target.value)}
                    required={taskDone === 'done'}
                    disabled={taskDone === 'skipped'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
            </div>

            {formError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
            <button type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              Log Session
            </button>
          </form>
        </div>
      )}

      {/* Session History */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          Session History
          {sessions.length > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{sessions.length} logged</span>}
        </h2>
        {sessions.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-2xl">
            <p className="text-3xl mb-2">⏱</p>
            <p className="text-gray-500 text-sm">No sessions logged yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => {
              const skipped = isSessionSkipped(s)
              const gap = skipped ? 0 : gapMinutes(s.plannedStart, s.actualStart)
              return (
                <div key={s._id} className={`bg-white border rounded-2xl p-4 shadow-sm ${skipped ? 'border-gray-200 opacity-75' : 'border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">{s.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.date}</p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1.5">
                      <GapBadge gap={gap} skipped={skipped} />
                      {!skipped && (
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />Planned: {s.plannedStart}–{s.plannedEnd}</span>
                          <span><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />Actual: {s.actualStart}–{s.actualEnd}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* AI Analysis */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-700">Procrastination Analysis</h2>
            <p className="text-xs text-gray-400 mt-0.5">AI analyzes your session gaps and gives personalized tips.</p>
          </div>
          <button onClick={handleAnalyze} disabled={aiLoading}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition shrink-0">
            {aiLoading ? <><span className="animate-spin">⟳</span> Analyzing...</> : '🧠 Analyze Patterns'}
          </button>
        </div>
        {aiError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{aiError}</p>}
        {suggestion && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-600">🧠</span>
              <p className="text-xs font-bold text-purple-700 uppercase tracking-widest">AI Feedback</p>
            </div>
            <MarkdownRenderer content={suggestion} />
          </div>
        )}
      </div>
    </div>
  )
}
