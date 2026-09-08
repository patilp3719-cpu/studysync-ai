'use client'

import { useEffect, useState } from 'react'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

const TASK_CATEGORIES = [
  'DSA / Algorithms', 'Web Development', 'System Design', 'Machine Learning / AI',
  'Database / SQL', 'DevOps / Cloud', 'Mobile Development', 'Open Source',
  'Project Work', 'Interview Prep', 'Reading / Research', 'Other',
]

interface StudySession {
  _id: string; subject: string; date: string; plannedStart: string; plannedEnd: string
  actualStart: string; actualEnd: string; skipped?: boolean
}

function gapMinutes(planned: string, actual: string): number {
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  return toMin(actual) - toMin(planned)
}

function isSessionSkipped(s: StudySession): boolean {
  if (s.skipped === true) return true
  return s.actualStart === s.plannedStart && s.actualEnd === s.plannedEnd
}

function GapBadge({ gap, skipped }: { gap: number; skipped: boolean }) {
  if (skipped) return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded"
      style={{ background: 'rgba(149,142,160,0.15)', color: '#958ea0', border: '1px solid rgba(149,142,160,0.3)' }}>
      Skipped
    </span>
  )
  if (gap <= 0) return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded"
      style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
      On time
    </span>
  )
  if (gap <= 15) return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py.5 rounded"
      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
      {gap}m late
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded"
      style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
      {gap}m late
    </span>
  )
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

const btnBase: React.CSSProperties = {
  cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
  borderRadius: '0.5rem', padding: '0.5rem 1rem', transition: 'all 0.15s', border: 'none',
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
    e.preventDefault(); setFormError('')
    const isSkipped = taskDone === 'skipped'
    const res = await fetch('/api/sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: category, date, plannedStart, plannedEnd,
        actualStart: isSkipped ? plannedStart : actualStart,
        actualEnd: isSkipped ? plannedEnd : actualEnd,
        skipped: isSkipped,
      }),
    })
    if (res.ok) {
      setCategory(TASK_CATEGORIES[0]); setDate(''); setPlannedStart(''); setPlannedEnd('')
      setActualStart(''); setActualEnd(''); setTaskDone('done'); setShowForm(false); loadSessions()
    } else {
      const data = await res.json()
      setFormError(data.error || 'Failed to log session')
    }
  }

  async function handleAnalyze() {
    setAiLoading(true); setAiError(''); setSuggestion('')
    try {
      const res = await fetch('/api/ai/procrastination')
      const data = await res.json()
      if (res.ok) setSuggestion(data.suggestion)
      else setAiError(data.error || 'Failed to analyze')
    } catch { setAiError('Something went wrong. Please try again.') }
    finally { setAiLoading(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#dfe2ee' }}>Smart Procrastination Detector</h1>
          <p className="text-sm mt-1" style={{ color: '#958ea0' }}>Log planned vs actual work times. AI detects your procrastination patterns.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ ...btnBase, background: showForm ? 'rgba(255,255,255,0.07)' : '#8B5CF6', color: showForm ? '#cbc3d7' : '#fff' }}>
          {showForm ? '✕ Hide Form' : '+ Log Session'}
        </button>
      </div>

      {/* Log Form */}
      {showForm && (
        <div style={cardStyle}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#958ea0' }}>Log a Work Session</p>
          <form onSubmit={handleLog} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Task Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                  {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
              </div>
            </div>

            {/* Task done / skipped toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#958ea0' }}>Task Status</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setTaskDone('done')} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition"
                  style={taskDone === 'done'
                    ? { background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.4)' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#958ea0', border: '1px solid rgba(73,68,84,0.5)' }}>
                  Task Done
                </button>
                <button type="button" onClick={() => setTaskDone('skipped')} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition"
                  style={taskDone === 'skipped'
                    ? { background: 'rgba(149,142,160,0.2)', color: '#cbc3d7', border: '1px solid rgba(149,142,160,0.4)' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#958ea0', border: '1px solid rgba(73,68,84,0.5)' }}>
                  Not Done / Skipped
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#7bd0ff' }}>Planned</p>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#958ea0' }}>Start</label>
                  <input type="time" value={plannedStart} onChange={e => setPlannedStart(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#958ea0' }}>End</label>
                  <input type="time" value={plannedEnd} onChange={e => setPlannedEnd(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div className="rounded-xl p-3 space-y-3" style={{
                background: taskDone === 'skipped' ? 'rgba(73,68,84,0.08)' : 'rgba(245,158,11,0.08)',
                border: taskDone === 'skipped' ? '1px solid rgba(73,68,84,0.3)' : '1px solid rgba(245,158,11,0.2)',
                opacity: taskDone === 'skipped' ? 0.5 : 1,
                pointerEvents: taskDone === 'skipped' ? 'none' : 'auto',
              }}>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: taskDone === 'skipped' ? '#958ea0' : '#F59E0B' }}>
                  {taskDone === 'skipped' ? 'Actual (N/A)' : 'Actual'}
                </p>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#958ea0' }}>Start</label>
                  <input type="time" value={actualStart} onChange={e => setActualStart(e.target.value)}
                    required={taskDone === 'done'} disabled={taskDone === 'skipped'} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#958ea0' }}>End</label>
                  <input type="time" value={actualEnd} onChange={e => setActualEnd(e.target.value)}
                    required={taskDone === 'done'} disabled={taskDone === 'skipped'} style={inputStyle} />
                </div>
              </div>
            </div>

            {formError && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ffb4ab', border: '1px solid rgba(239,68,68,0.3)' }}>{formError}</p>}
            <button type="submit" style={{ ...btnBase, background: '#8B5CF6', color: '#fff', width: '100%' }}>Log Session</button>
          </form>
        </div>
      )}

      {/* Session History */}
      <div>
        <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#dfe2ee' }}>
          Session History
          {sessions.length > 0 && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded"
              style={{ background: 'rgba(73,68,84,0.5)', color: '#958ea0' }}>{sessions.length} logged</span>
          )}
        </p>
        {sessions.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed rgba(73,68,84,0.5)' }}>
            <p className="text-sm" style={{ color: '#958ea0' }}>No sessions logged yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => {
              const skipped = isSessionSkipped(s)
              const gap = skipped ? 0 : gapMinutes(s.plannedStart, s.actualStart)
              return (
                <div key={s._id} className="rounded-xl p-4" style={{ ...cardStyle, padding: '1rem', opacity: skipped ? 0.7 : 1 }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#dfe2ee' }}>{s.subject}</p>
                      <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>{s.date}</p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1.5">
                      <GapBadge gap={gap} skipped={skipped} />
                      {!skipped && (
                        <div className="flex gap-4 font-mono text-[10px]" style={{ color: '#958ea0' }}>
                          <span>
                            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: '#7bd0ff' }} />
                            {s.plannedStart}–{s.plannedEnd}
                          </span>
                          <span>
                            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: '#F59E0B' }} />
                            {s.actualStart}–{s.actualEnd}
                          </span>
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
      <div style={cardStyle}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#dfe2ee' }}>Procrastination Analysis</p>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>AI analyzes your session gaps and gives personalized tips.</p>
          </div>
          <button onClick={handleAnalyze} disabled={aiLoading}
            style={{ ...btnBase, background: aiLoading ? 'rgba(139,92,246,0.5)' : '#8B5CF6', color: '#fff', opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? '⟳ Analyzing...' : 'Analyze Patterns'}
          </button>
        </div>
        {aiError && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ffb4ab', border: '1px solid rgba(239,68,68,0.3)' }}>{aiError}</p>}
        {suggestion && (
          <div className="rounded-xl p-5" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B5CF6' }}>AI Feedback</p>
            <MarkdownRenderer content={suggestion} />
          </div>
        )}
      </div>
    </div>
  )
}
