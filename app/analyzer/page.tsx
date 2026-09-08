'use client'

import { useEffect, useState, useCallback } from 'react'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

const TASK_CATEGORIES = [
  'DSA / Algorithms', 'Web Development', 'System Design', 'Machine Learning / AI',
  'Database / SQL', 'DevOps / Cloud', 'Mobile Development', 'Open Source',
  'Project Work', 'Interview Prep', 'Reading / Research', 'Other',
]

interface FocusLog {
  _id: string; date: string; subject: string
  focusedMinutes: number; distractedMinutes: number; notes?: string
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
  const color = ratio >= 70 ? '#10B981' : ratio >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div className="w-full rounded-full h-1.5 mt-1" style={{ background: 'rgba(73,68,84,0.4)' }}>
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${ratio}%`, background: color }} />
    </div>
  )
}

function RatioBadge({ ratio }: { ratio: number }) {
  const color = ratio >= 70 ? '#10B981' : ratio >= 40 ? '#F59E0B' : '#EF4444'
  const bg = ratio >= 70 ? 'rgba(16,185,129,0.15)' : ratio >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'
  const border = ratio >= 70 ? 'rgba(16,185,129,0.3)' : ratio >= 40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'
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
  const color = pct === 100 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#7bd0ff'
  const bg = pct === 100 ? 'rgba(16,185,129,0.15)' : pct >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(123,208,255,0.15)'
  const border = pct === 100 ? 'rgba(16,185,129,0.3)' : pct >= 50 ? 'rgba(245,158,11,0.3)' : 'rgba(123,208,255,0.3)'
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
      <span style={{ color }}>{done}/{total} steps done</span>
      <span className="px-1.5 py-0.5 rounded"
        style={{ background: bg, color, border: `1px solid ${border}` }}>{pct}%</span>
    </div>
  )
}

export default function AnalyzerPage() {
  const [logs, setLogs] = useState<FocusLog[]>([])
  const [date, setDate] = useState('')
  const [category, setCategory] = useState(TASK_CATEGORIES[0])
  const [focusedMinutes, setFocusedMinutes] = useState('')
  const [distractedMinutes, setDistractedMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [suggestion, setSuggestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const [plans, setPlans] = useState<AnalysisPlan[]>([])
  const [showPlans, setShowPlans] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    const res = await fetch('/api/focus-logs')
    if (res.ok) setLogs(await res.json())
  }, [])
  const loadPlans = useCallback(async () => {
    const res = await fetch('/api/analysis-plans')
    if (res.ok) setPlans(await res.json())
  }, [])
  useEffect(() => { loadLogs(); loadPlans() }, [loadLogs, loadPlans])

  async function handleLog(e: React.FormEvent) {
    e.preventDefault(); setFormError('')
    const res = await fetch('/api/focus-logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, subject: category, focusedMinutes, distractedMinutes, notes }),
    })
    if (res.ok) {
      setDate(''); setCategory(TASK_CATEGORIES[0]); setFocusedMinutes('')
      setDistractedMinutes(''); setNotes(''); setShowForm(false); loadLogs()
    } else {
      const data = await res.json()
      setFormError(data.error || 'Failed to log session')
    }
  }

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
        source: `Focus Analysis — ${logs.length} session${logs.length !== 1 ? 's' : ''}`,
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

  const overallRatio = logs.length > 0
    ? focusRatio(logs.reduce((s, l) => s + l.focusedMinutes, 0), logs.reduce((s, l) => s + l.distractedMinutes, 0))
    : null

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#dfe2ee' }}>Study vs Distraction Analyzer</h1>
          <p className="text-sm mt-1" style={{ color: '#958ea0' }}>Track your focus time vs distraction. Save AI plans and follow your progress.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {plans.length > 0 && (
            <button onClick={() => setShowPlans(v => !v)}
              style={{ ...btnBase, background: 'rgba(139,92,246,0.1)', color: '#d0bcff', border: '1px solid rgba(139,92,246,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
              {showPlans ? '▲ Hide Plans' : `📋 My Plans (${plans.length})`}
            </button>
          )}
          <button onClick={() => setShowForm(v => !v)}
            style={{ ...btnBase, background: showForm ? 'rgba(255,255,255,0.07)' : '#3b82f6', color: showForm ? '#cbc3d7' : '#fff' }}>
            {showForm ? '✕ Hide Form' : '+ Log Session'}
          </button>
        </div>
      </div>

      {/* ── Overall Stats Banner ── */}
      {overallRatio !== null && (
        <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <div className="flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#958ea0' }}>
              Overall Focus Ratio ({logs.length} sessions)
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
          <div className="text-center sm:text-right shrink-0">
            <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: '#7bd0ff' }}>{logs.reduce((s, l) => s + l.focusedMinutes, 0)} min</p>
            <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>total focused</p>
          </div>
        </div>
      )}

      {/* ── Log Form ── */}
      {showForm && (
        <div style={cardStyle}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#958ea0' }}>Log a Focus Session</p>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#10B981' }}>🟢 Focused Minutes</label>
                <input type="number" min="0" value={focusedMinutes} onChange={e => setFocusedMinutes(e.target.value)} required
                  placeholder="e.g. 45" style={inputStyle} />
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#EF4444' }}>🔴 Distracted Minutes</label>
                <input type="number" min="0" value={distractedMinutes} onChange={e => setDistractedMinutes(e.target.value)} required
                  placeholder="e.g. 15" style={inputStyle} />
              </div>
            </div>
            {focusedMinutes && distractedMinutes && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(73,68,84,0.4)' }}>
                <p className="font-mono text-[10px] mb-1" style={{ color: '#958ea0' }}>Focus ratio for this session:</p>
                <div className="flex items-center gap-3">
                  <RatioBadge ratio={focusRatio(Number(focusedMinutes), Number(distractedMinutes))} />
                  <div className="flex-1"><FocusBar ratio={focusRatio(Number(focusedMinutes), Number(distractedMinutes))} /></div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Notes (optional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Phone notifications were distracting" style={inputStyle} />
            </div>
            {formError && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ffb4ab', border: '1px solid rgba(239,68,68,0.3)' }}>{formError}</p>}
            <div className="flex gap-3">
              <button type="submit" style={{ ...btnBase, background: '#3b82f6', color: '#fff' }}>Log Session</button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Log History ── */}
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#494454' }}>
          Focus Log History
          {logs.length > 0 && <span className="ml-2 normal-case" style={{ color: '#958ea0' }}>{logs.length} logged</span>}
        </p>
        {logs.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed rgba(73,68,84,0.5)' }}>
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-sm" style={{ color: '#958ea0' }}>No focus logs yet. Log your first session above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => {
              const ratio = focusRatio(log.focusedMinutes, log.distractedMinutes)
              return (
                <div key={log._id} className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                  style={cardStyle}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm" style={{ color: '#dfe2ee' }}>{log.subject}</p>
                      <RatioBadge ratio={ratio} />
                    </div>
                    <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>{log.date}</p>
                    {log.notes && <p className="text-xs italic mt-1" style={{ color: '#958ea0' }}>"{log.notes}"</p>}
                    <FocusBar ratio={ratio} />
                  </div>
                  <div className="flex gap-4 text-sm shrink-0 sm:text-right">
                    <div className="text-center">
                      <p className="font-bold font-mono tabular-nums" style={{ color: '#10B981' }}>{log.focusedMinutes}</p>
                      <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>focused</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold font-mono tabular-nums" style={{ color: '#EF4444' }}>{log.distractedMinutes}</p>
                      <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>distracted</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── AI Analysis Section ── */}
      <div style={cardStyle}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#10B981' }}>🎯 AI Focus Analysis</p>
            <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>AI reviews your focus patterns and gives personalized coaching.</p>
          </div>
          <button onClick={handleAnalyze} disabled={aiLoading}
            style={{ ...btnBase, background: aiLoading ? 'rgba(16,185,129,0.4)' : '#10B981', color: '#fff', opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? '⟳ Analyzing...' : '🎯 Get AI Analysis'}
          </button>
        </div>

        {aiError && <p className="text-sm rounded-lg px-3 py-2 mb-4" style={{ background: 'rgba(239,68,68,0.1)', color: '#ffb4ab', border: '1px solid rgba(239,68,68,0.3)' }}>{aiError}</p>}

        {suggestion && (
          <div className="rounded-xl p-5" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
            {/* AI header + Save button row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#10B981' }}>AI Suggestion</p>
              <div className="flex items-center gap-2">
                {savedMsg && (
                  <span className="font-mono text-[10px] font-bold px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                    {savedMsg}
                  </span>
                )}
                <button onClick={() => setShowSaveForm(v => !v)}
                  style={{ ...btnBase, background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                  {showSaveForm ? '✕ Cancel' : '💾 Save This Plan'}
                </button>
              </div>
            </div>

            {/* Save form */}
            {showSaveForm && (
              <div className="mb-4 rounded-xl p-4 space-y-3"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#958ea0' }}>Save AI Plan</p>
                <div className="flex gap-2">
                  <input type="text" value={saveTitle} onChange={e => setSaveTitle(e.target.value)}
                    placeholder="Give this plan a name (e.g. Week 2 Focus Boost)"
                    style={{ ...inputStyle, flex: 1, width: 'auto' }} />
                  <button onClick={handleSavePlan} disabled={saving || !saveTitle.trim()}
                    style={{ ...btnBase, background: '#10B981', color: '#fff', opacity: (saving || !saveTitle.trim()) ? 0.5 : 1 }}>
                    {saving ? '...' : '💾 Save'}
                  </button>
                </div>
                <p className="font-mono text-[10px]" style={{ color: '#494454' }}>
                  AI steps will be automatically extracted as a checklist so you can track your progress.
                </p>
              </div>
            )}

            {/* AI content */}
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
            <button onClick={() => setShowPlans(false)}
              className="font-mono text-[10px]" style={{ color: '#958ea0' }}>✕ Hide</button>
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed rgba(73,68,84,0.5)' }}>
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm" style={{ color: '#958ea0' }}>No saved plans yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map(plan => {
                const doneCount = plan.checklistItems.filter(i => i.done).length
                const totalCount = plan.checklistItems.length
                const isExpanded = expandedId === plan._id
                const isEditing = editingId === plan._id

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
                          className="w-full resize-y text-sm"
                          style={inputStyle} />
                        <p className="font-mono text-[10px]" style={{ color: '#494454' }}>Editing resets checklist progress.</p>
                      </div>
                    )}

                    {/* Expanded: checklist + full content */}
                    {isExpanded && !isEditing && (
                      <div style={{ borderTop: '1px solid rgba(51,65,85,0.4)' }}>

                        {/* Checklist tracking panel */}
                        {plan.checklistItems.length > 0 && (
                          <div className="px-4 py-4" style={{ background: 'rgba(139,92,246,0.06)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>
                                ✅ Action Checklist
                              </p>
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
                                    <input type="checkbox" checked={item.done}
                                      onChange={() => handleToggleItem(plan, item.id)} className="sr-only" />
                                    <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition"
                                      style={{
                                        background: item.done ? '#10B981' : 'transparent',
                                        borderColor: item.done ? '#10B981' : 'rgba(73,68,84,0.6)',
                                      }}>
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
                            {doneCount > 0 && doneCount < totalCount && (
                              <p className="font-mono text-[10px] mt-3" style={{ color: '#8B5CF6' }}>
                                🔥 {doneCount} of {totalCount} steps done — keep going!
                              </p>
                            )}
                            {doneCount === 0 && (
                              <p className="font-mono text-[10px] mt-3" style={{ color: '#494454' }}>
                                💡 Check off steps as you implement each recommendation.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Full AI plan content */}
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
