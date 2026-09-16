'use client'

import { useEffect, useState, useCallback } from 'react'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

// Unified session shape — matches the extended StudySession model
interface StudySession {
  _id: string
  subject: string
  date: string
  focusedMinutes: number
  distractedMinutes: number
  notes?: string
  source: 'manual' | 'timer-auto'
  plannedStart?: string
  plannedEnd?: string
  actualStart?: string
  actualEnd?: string
}

interface ChecklistItem { id: string; text: string; done: boolean }
interface AnalysisPlan {
  _id: string; title: string; content: string
  checklistItems: ChecklistItem[]; source: string; createdAt: string
}

function extractChecklistItems(markdown: string): ChecklistItem[] {
  const items: ChecklistItem[] = []
  let index = 0
  for (const line of markdown.split('\n')) {
    const stripped = line.trim()
    const m = stripped.match(/^\d+\.\s+(.+)/) || stripped.match(/^[-*]\s+(.+)/)
    if (m) {
      const text = m[1].replace(/\*\*/g, '').replace(/`/g, '').trim()
      if (text.length > 5 && text.length < 200)
        items.push({ id: `item-${index++}`, text, done: false })
    }
  }
  const seen = new Set<string>()
  return items.filter(i => { if (seen.has(i.text)) return false; seen.add(i.text); return true }).slice(0, 15)
}

function focusRatio(focused: number, distracted: number): number {
  const total = focused + distracted
  return total === 0 ? 0 : Math.round((focused / total) * 100)
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(19,27,46,0.7)',
  border: '1px solid rgba(51,65,85,0.4)',
  borderRadius: '0.75rem',
  padding: '1.25rem',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(51,65,85,0.6)',
  color: '#dfe2ee',
  borderRadius: '0.5rem',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  width: '100%',
  outline: 'none',
}

const btnBase: React.CSSProperties = {
  cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
  borderRadius: '0.5rem', padding: '0.5rem 1rem', transition: 'all 0.15s', border: 'none',
}

function FocusBar({ ratio }: { ratio: number }) {
  // Green = focused/on-track, Red = distracted/low
  const color = ratio >= 70 ? '#10B981' : ratio >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div className="w-full rounded-full h-1.5 mt-1" style={{ background: 'rgba(73,68,84,0.4)' }}>
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${ratio}%`, background: color }} />
    </div>
  )
}

function RatioBadge({ ratio }: { ratio: number }) {
  const color  = ratio >= 70 ? '#10B981' : ratio >= 40 ? '#F59E0B' : '#EF4444'
  const bg     = ratio >= 70 ? 'rgba(16,185,129,0.15)' : ratio >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'
  const border = ratio >= 70 ? 'rgba(16,185,129,0.3)'  : ratio >= 40 ? 'rgba(245,158,11,0.3)'  : 'rgba(239,68,68,0.3)'
  return (
    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
      style={{ background: bg, color, border: `1px solid ${border}` }}>
      {ratio}% focused
    </span>
  )
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  if (total === 0) return null
  const pct = Math.round((done / total) * 100)
  const color  = pct === 100 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#7bd0ff'
  const bg     = pct === 100 ? 'rgba(16,185,129,0.15)' : pct >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(123,208,255,0.15)'
  const border = pct === 100 ? 'rgba(16,185,129,0.3)'  : pct >= 50 ? 'rgba(245,158,11,0.3)'  : 'rgba(123,208,255,0.3)'
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
      <span style={{ color }}>{done}/{total} steps done</span>
      <span className="px-1.5 py-0.5 rounded" style={{ background: bg, color, border: `1px solid ${border}` }}>{pct}%</span>
    </div>
  )
}

/** Per-subject aggregate row in the breakdown table */
function SubjectRow({ subject, sessions }: { subject: string; sessions: StudySession[] }) {
  const totalFocus = sessions.reduce((s, r) => s + (r.focusedMinutes || 0), 0)
  const totalDistract = sessions.reduce((s, r) => s + (r.distractedMinutes || 0), 0)
  const ratio = focusRatio(totalFocus, totalDistract)
  return (
    <div className="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(73,68,84,0.3)' }}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#dfe2ee' }}>{subject}</p>
        <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
        <FocusBar ratio={ratio} />
      </div>
      <div className="flex gap-4 shrink-0">
        <div className="text-center">
          <p className="font-bold font-mono tabular-nums text-sm" style={{ color: '#10B981' }}>{totalFocus}</p>
          <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>focused</p>
        </div>
        <div className="text-center">
          <p className="font-bold font-mono tabular-nums text-sm" style={{ color: '#EF4444' }}>{totalDistract}</p>
          <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>distracted</p>
        </div>
        <RatioBadge ratio={ratio} />
      </div>
    </div>
  )
}

export default function AnalyzerPage() {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)

  const [suggestion, setSuggestion] = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiError, setAiError]       = useState('')

  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveTitle, setSaveTitle]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [savedMsg, setSavedMsg]     = useState('')

  const [plans, setPlans]         = useState<AnalysisPlan[]>([])
  const [showPlans, setShowPlans] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editSaving, setEditSaving]   = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  // Only sessions that have focus-tracking data (timer-auto or manual with minutes > 0)
  const loadSessions = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sessions')
    if (res.ok) {
      const all: StudySession[] = await res.json()
      // include timer-auto sessions and manual sessions that have focus minutes
      setSessions(all.filter(s => s.source === 'timer-auto' || s.focusedMinutes > 0 || s.distractedMinutes > 0))
    }
    setLoading(false)
  }, [])

  const loadPlans = useCallback(async () => {
    const res = await fetch('/api/analysis-plans')
    if (res.ok) setPlans(await res.json())
  }, [])

  useEffect(() => { loadSessions(); loadPlans() }, [loadSessions, loadPlans])

  async function handleAnalyze() {
    setAiLoading(true); setAiError(''); setSuggestion(''); setSavedMsg(''); setShowSaveForm(false)
    try {
      const res = await fetch('/api/ai/focus-analysis')
      const data = await res.json()
      if (res.ok) setSuggestion(data.suggestion)
      else setAiError(data.error || 'Failed to analyze')
    } catch { setAiError('Something went wrong. Please try again.') }
    finally { setAiLoading(false) }
  }

  async function handleSavePlan() {
    if (!saveTitle.trim() || !suggestion) return
    setSaving(true); setSavedMsg('')
    const checklistItems = extractChecklistItems(suggestion)
    const res = await fetch('/api/analysis-plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: saveTitle.trim(), content: suggestion, checklistItems,
        source: `Focus Analysis — ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSavedMsg('✅ Plan saved!'); setSaveTitle(''); setShowSaveForm(false)
      setShowPlans(true); loadPlans()
      setTimeout(() => setSavedMsg(''), 4000)
    }
  }

  async function handleToggleItem(plan: AnalysisPlan, itemId: string) {
    const updated = plan.checklistItems.map(i => i.id === itemId ? { ...i, done: !i.done } : i)
    setPlans(prev => prev.map(p => p._id === plan._id ? { ...p, checklistItems: updated } : p))
    await fetch(`/api/analysis-plans/${plan._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistItems: updated }),
    })
  }

  async function handleSaveEdit(id: string) {
    setEditSaving(true)
    const res = await fetch(`/api/analysis-plans/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, content: editContent }),
    })
    setEditSaving(false)
    if (res.ok) { setEditingId(null); loadPlans() }
  }

  async function handleDeletePlan(id: string) {
    await fetch(`/api/analysis-plans/${id}`, { method: 'DELETE' })
    if (expandedId === id) setExpandedId(null)
    if (editingId === id) setEditingId(null)
    loadPlans()
  }

  // ── Derived analytics ──────────────────────────────────────────────────────
  const totalFocused    = sessions.reduce((s, r) => s + (r.focusedMinutes || 0), 0)
  const totalDistracted = sessions.reduce((s, r) => s + (r.distractedMinutes || 0), 0)
  const overallRatio    = focusRatio(totalFocused, totalDistracted)

  // Streak: consecutive days (most recent first) with at least one session
  const streak = (() => {
    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse()
    let s = 0; let check = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    for (const d of dates) {
      if (d === check) {
        s++
        const prev = new Date(check); prev.setDate(prev.getDate() - 1)
        check = prev.toISOString().split('T')[0]
      } else break
    }
    return s
  })()

  // Top 5 subjects by total focus minutes
  const subjectMap = new Map<string, StudySession[]>()
  sessions.forEach(s => {
    const arr = subjectMap.get(s.subject) ?? []
    arr.push(s)
    subjectMap.set(s.subject, arr)
  })
  const subjectRows = [...subjectMap.entries()]
    .map(([subj, rows]) => ({ subj, rows, total: rows.reduce((a, r) => a + (r.focusedMinutes || 0), 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Last 7 days daily focus summary
  const last7: { date: string; focused: number; distracted: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const dayRows = sessions.filter(s => s.date === dateStr)
    last7.push({
      date: dateStr,
      focused: dayRows.reduce((a, r) => a + (r.focusedMinutes || 0), 0),
      distracted: dayRows.reduce((a, r) => a + (r.distractedMinutes || 0), 0),
    })
  }
  const maxBar = Math.max(...last7.map(d => d.focused + d.distracted), 1)

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#dfe2ee' }}>Focus Analyzer</h1>
          <p className="text-sm mt-1" style={{ color: '#958ea0' }}>
            Analytics over all your study sessions — Timer auto-logs included. Save AI plans and track progress.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {plans.length > 0 && (
            <button onClick={() => setShowPlans(v => !v)}
              style={{ ...btnBase, background: 'rgba(139,92,246,0.1)', color: '#d0bcff', border: '1px solid rgba(139,92,246,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
              {showPlans ? '▲ Hide Plans' : `📋 My Plans (${plans.length})`}
            </button>
          )}
        </div>
      </div>

      {/* ── Empty state ── */}
      {!loading && sessions.length === 0 && (
        <div className="text-center py-14 rounded-xl" style={{ border: '1px dashed rgba(73,68,84,0.5)' }}>
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-sm font-semibold mb-1" style={{ color: '#dfe2ee' }}>No focus data yet</p>
          <p className="text-xs" style={{ color: '#958ea0' }}>
            Complete a Pomodoro session in <strong style={{ color: '#d0bcff' }}>Timer</strong> — it auto-logs here.
            Or log a session manually in <strong style={{ color: '#d0bcff' }}>Sessions</strong>.
          </p>
        </div>
      )}

      {/* ── Summary Stats ── */}
      {sessions.length > 0 && (
        <>
          {/* Overall ratio banner */}
          <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <div className="flex-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#958ea0' }}>
                Overall Focus Ratio — {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold font-mono tabular-nums"
                  style={{ color: overallRatio >= 70 ? '#10B981' : overallRatio >= 40 ? '#F59E0B' : '#EF4444' }}>
                  {overallRatio}%
                </span>
                <div className="flex-1">
                  <FocusBar ratio={overallRatio} />
                  <p className="font-mono text-[10px] mt-1" style={{ color: '#958ea0' }}>
                    {overallRatio >= 70 ? '🔥 Great focus! Keep it up.' : overallRatio >= 40 ? '⚡ Decent — room to improve.' : '⚠️ High distraction. Check AI tips below.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-6 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: '#10B981' }}>{totalFocused}</p>
                <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>focused min</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: '#EF4444' }}>{totalDistracted}</p>
                <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>distracted min</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: '#F59E0B' }}>{streak}d</p>
                <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>streak</p>
              </div>
            </div>
          </div>

          {/* Last 7 days bar chart */}
          <div style={cardStyle}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#958ea0' }}>Last 7 Days</p>
            <div className="flex items-end gap-1 h-24">
              {last7.map(day => {
                const focusPct  = day.focused   / maxBar * 100
                const distPct   = day.distracted / maxBar * 100
                const label     = new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                      {focusPct > 0 && (
                        <div className="w-full rounded-t transition-all"
                          style={{ height: `${focusPct}%`, background: '#10B981', minHeight: 2 }}
                          title={`${day.date}: ${day.focused}m focused`} />
                      )}
                      {distPct > 0 && (
                        <div className="w-full rounded-b transition-all"
                          style={{ height: `${distPct}%`, background: '#EF4444', opacity: 0.6, minHeight: 2 }}
                          title={`${day.date}: ${day.distracted}m distracted`} />
                      )}
                      {focusPct === 0 && distPct === 0 && (
                        <div className="w-full rounded" style={{ height: 3, background: 'rgba(73,68,84,0.3)' }} />
                      )}
                    </div>
                    <p className="font-mono text-[9px]" style={{ color: '#958ea0' }}>{label}</p>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: '#10B981' }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#10B981' }} />Focused
              </span>
              <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: '#EF4444' }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#EF4444', opacity: 0.6 }} />Distracted
              </span>
            </div>
          </div>

          {/* Subject breakdown */}
          {subjectRows.length > 0 && (
            <div style={cardStyle}>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#958ea0' }}>
                Top Subjects by Focus Time
              </p>
              <div className="space-y-2">
                {subjectRows.map(({ subj, rows }) => (
                  <SubjectRow key={subj} subject={subj} sessions={rows} />
                ))}
              </div>
            </div>
          )}

          {/* Session log */}
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#494454' }}>
              Session Log
              <span className="ml-2 normal-case" style={{ color: '#958ea0' }}>{sessions.length} total</span>
            </p>
            <div className="space-y-2">
              {sessions.map(s => {
                const ratio = focusRatio(s.focusedMinutes || 0, s.distractedMinutes || 0)
                return (
                  <div key={s._id} className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                    style={cardStyle}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: '#dfe2ee' }}>{s.subject}</p>
                        {(s.focusedMinutes > 0 || s.distractedMinutes > 0) && <RatioBadge ratio={ratio} />}
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                          style={s.source === 'timer-auto'
                            ? { background: 'rgba(139,92,246,0.12)', color: '#d0bcff', border: '1px solid rgba(139,92,246,0.25)' }
                            : { background: 'rgba(59,130,246,0.1)', color: '#7bd0ff', border: '1px solid rgba(59,130,246,0.25)' }}>
                          {s.source === 'timer-auto' ? '⏱ Timer' : '✏️ Manual'}
                        </span>
                      </div>
                      <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>{s.date}</p>
                      {s.notes && <p className="text-xs italic mt-1" style={{ color: '#958ea0' }}>"{s.notes}"</p>}
                      {(s.focusedMinutes > 0 || s.distractedMinutes > 0) && <FocusBar ratio={ratio} />}
                    </div>
                    {(s.focusedMinutes > 0 || s.distractedMinutes > 0) && (
                      <div className="flex gap-4 text-sm shrink-0 sm:text-right">
                        <div className="text-center">
                          <p className="font-bold font-mono tabular-nums" style={{ color: '#10B981' }}>{s.focusedMinutes}</p>
                          <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>focused</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold font-mono tabular-nums" style={{ color: '#EF4444' }}>{s.distractedMinutes}</p>
                          <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>distracted</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── AI Analysis Section ── */}
      <div style={cardStyle}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#8B5CF6' }}>
              ✦ AI Focus Analysis
            </p>
            <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>
              AI reviews your focus patterns across all sessions and gives personalised coaching.
            </p>
          </div>
          <button onClick={handleAnalyze} disabled={aiLoading || sessions.length === 0}
            style={{ ...btnBase, background: aiLoading ? 'rgba(139,92,246,0.4)' : '#8B5CF6', color: '#fff', opacity: (aiLoading || sessions.length === 0) ? 0.6 : 1 }}>
            {aiLoading ? '⟳ Analyzing...' : '✦ Get AI Analysis'}
          </button>
        </div>

        {sessions.length === 0 && !aiLoading && (
          <p className="font-mono text-[10px]" style={{ color: '#494454' }}>
            Log at least one session to enable AI analysis.
          </p>
        )}

        {aiError && <p className="text-sm rounded-lg px-3 py-2 mb-4" style={{ background: 'rgba(239,68,68,0.1)', color: '#ffb4ab', border: '1px solid rgba(239,68,68,0.3)' }}>{aiError}</p>}

        {suggestion && (
          <div className="rounded-xl p-5" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>AI Suggestion</p>
              <div className="flex items-center gap-2">
                {savedMsg && (
                  <span className="font-mono text-[10px] font-bold px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                    {savedMsg}
                  </span>
                )}
                <button onClick={() => setShowSaveForm(v => !v)}
                  style={{ ...btnBase, background: 'rgba(139,92,246,0.1)', color: '#d0bcff', border: '1px solid rgba(139,92,246,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                  {showSaveForm ? '✕ Cancel' : '💾 Save This Plan'}
                </button>
              </div>
            </div>

            {showSaveForm && (
              <div className="mb-4 rounded-xl p-4 space-y-3"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#958ea0' }}>Save AI Plan</p>
                <div className="flex gap-2">
                  <input type="text" value={saveTitle} onChange={e => setSaveTitle(e.target.value)}
                    placeholder="Give this plan a name (e.g. Week 2 Focus Boost)"
                    style={{ ...inputStyle, flex: 1, width: 'auto' }} />
                  <button onClick={handleSavePlan} disabled={saving || !saveTitle.trim()}
                    style={{ ...btnBase, background: '#8B5CF6', color: '#fff', opacity: (saving || !saveTitle.trim()) ? 0.5 : 1 }}>
                    {saving ? '...' : '💾 Save'}
                  </button>
                </div>
              </div>
            )}

            <MarkdownRenderer content={suggestion} />
          </div>
        )}
      </div>

      {/* ── Saved Plans Section ── */}
      {showPlans && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#494454' }}>My Saved AI Plans</p>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded"
                style={{ background: 'rgba(73,68,84,0.3)', color: '#958ea0' }}>{plans.length} saved</span>
            </div>
            <button onClick={() => setShowPlans(false)} className="font-mono text-[10px]" style={{ color: '#958ea0' }}>✕ Hide</button>
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed rgba(73,68,84,0.5)' }}>
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm" style={{ color: '#958ea0' }}>No saved plans yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map(plan => {
                const doneCount  = plan.checklistItems.filter(i => i.done).length
                const totalCount = plan.checklistItems.length
                const isExpanded = expandedId === plan._id
                const isEditing  = editingId  === plan._id

                return (
                  <div key={plan._id} className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(51,65,85,0.4)', background: 'rgba(15,23,42,0.5)' }}>

                    {/* Plan header */}
                    <div className="px-4 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                              style={{ ...inputStyle, fontWeight: 700 }} />
                          ) : (
                            <p className="font-bold text-sm truncate" style={{ color: '#dfe2ee' }}>{plan.title}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="font-mono text-[10px]" style={{ color: '#958ea0' }}>{plan.source}</span>
                            <span style={{ color: '#494454' }}>·</span>
                            <span className="font-mono text-[10px]" style={{ color: '#958ea0' }}>
                              {new Date(plan.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {totalCount > 0 && !isEditing && (
                            <div className="mt-2">
                              <ProgressRing done={doneCount} total={totalCount} />
                              <div className="w-full rounded-full h-1 mt-1.5" style={{ background: 'rgba(73,68,84,0.4)' }}>
                                <div className="h-1 rounded-full transition-all"
                                  style={{
                                    width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`,
                                    background: doneCount === totalCount ? '#10B981' : '#8B5CF6',
                                  }} />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0 flex-wrap">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSaveEdit(plan._id)} disabled={editSaving}
                                style={{ ...btnBase, background: '#8B5CF6', color: '#fff', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                                {editSaving ? '...' : '✓ Save'}
                              </button>
                              <button onClick={() => setEditingId(null)}
                                style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setExpandedId(isExpanded ? null : plan._id)}
                                style={{ ...btnBase, background: 'rgba(139,92,246,0.1)', color: '#d0bcff', border: '1px solid rgba(139,92,246,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                                {isExpanded ? '▲ Close' : '▶ View'}
                              </button>
                              <button onClick={() => { setEditingId(plan._id); setEditTitle(plan.title); setEditContent(plan.content); setExpandedId(null) }}
                                style={{ ...btnBase, background: 'rgba(59,130,246,0.1)', color: '#7bd0ff', border: '1px solid rgba(59,130,246,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                                ✏️ Edit
                              </button>
                              <button onClick={() => handleDeletePlan(plan._id)}
                                style={{ ...btnBase, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit mode */}
                    {isEditing && (
                      <div className="px-4 py-4 space-y-3"
                        style={{ borderTop: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.05)' }}>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>Edit Plan Content</p>
                        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={14}
                          className="w-full resize-y text-sm" style={inputStyle} />
                        <p className="font-mono text-[10px]" style={{ color: '#494454' }}>Editing resets checklist progress.</p>
                      </div>
                    )}

                    {/* Expanded: checklist + full content */}
                    {isExpanded && !isEditing && (
                      <div style={{ borderTop: '1px solid rgba(51,65,85,0.4)' }}>
                        {plan.checklistItems.length > 0 && (
                          <div className="px-4 py-4" style={{ background: 'rgba(139,92,246,0.06)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>✅ Action Checklist</p>
                              {doneCount === totalCount && totalCount > 0 && (
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                                  🎉 All done!
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {plan.checklistItems.map(item => (
                                <label key={item.id} className="flex items-start gap-3 cursor-pointer rounded-lg px-3 py-2.5 transition-all"
                                  style={{
                                    background: item.done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                                    border: item.done ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(73,68,84,0.4)',
                                  }}>
                                  <div className="relative mt-0.5 shrink-0">
                                    <input type="checkbox" checked={item.done} onChange={() => handleToggleItem(plan, item.id)} className="sr-only" />
                                    <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition"
                                      style={{ background: item.done ? '#10B981' : 'transparent', borderColor: item.done ? '#10B981' : 'rgba(73,68,84,0.6)' }}>
                                      {item.done && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-sm leading-snug transition"
                                    style={{ color: item.done ? '#958ea0' : '#cbc3d7', textDecoration: item.done ? 'line-through' : 'none' }}>
                                    {item.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="px-4 py-4" style={{ background: 'rgba(0,0,0,0.15)' }}>
                          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#494454' }}>Full AI Analysis</p>
                          <MarkdownRenderer content={plan.content} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
