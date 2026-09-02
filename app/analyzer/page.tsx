'use client'

import { useEffect, useState, useCallback } from 'react'
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

interface FocusLog {
  _id: string
  date: string
  subject: string
  focusedMinutes: number
  distractedMinutes: number
  notes?: string
}

interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

interface AnalysisPlan {
  _id: string
  title: string
  content: string
  checklistItems: ChecklistItem[]
  source: string
  createdAt: string
}

// ─── Helper: extract actionable steps from AI markdown ───────────────────────
function extractChecklistItems(markdown: string): ChecklistItem[] {
  const items: ChecklistItem[] = []
  const lines = markdown.split('\n')
  let index = 0
  for (const line of lines) {
    const stripped = line.trim()
    // Match numbered list items: "1. ..." or bullet list: "- ..." / "* ..."
    const numbered = stripped.match(/^\d+\.\s+(.+)/)
    const bullet = stripped.match(/^[-*]\s+(.+)/)
    const match = numbered || bullet
    if (match) {
      const text = match[1]
        .replace(/\*\*/g, '')   // strip bold markdown
        .replace(/`/g, '')
        .trim()
      if (text.length > 5 && text.length < 200) {
        items.push({ id: `item-${index++}`, text, done: false })
      }
    }
  }
  // Deduplicate and cap at 15 items for usability
  const seen = new Set<string>()
  return items.filter(i => {
    if (seen.has(i.text)) return false
    seen.add(i.text)
    return true
  }).slice(0, 15)
}

// ─── Focus helpers ────────────────────────────────────────────────────────────
function focusRatio(focused: number, distracted: number): number {
  const total = focused + distracted
  return total === 0 ? 0 : Math.round((focused / total) * 100)
}

function FocusBar({ ratio }: { ratio: number }) {
  const color = ratio >= 70 ? 'bg-green-500' : ratio >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${ratio}%` }} />
    </div>
  )
}

function RatioBadge({ ratio }: { ratio: number }) {
  if (ratio >= 70) return <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{ratio}% focused</span>
  if (ratio >= 40) return <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{ratio}% focused</span>
  return <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{ratio}% focused</span>
}

// ─── Progress ring for checklist completion ───────────────────────────────────
function ProgressRing({ done, total }: { done: number; total: number }) {
  if (total === 0) return null
  const pct = Math.round((done / total) * 100)
  const color = pct === 100 ? 'text-green-600' : pct >= 50 ? 'text-yellow-500' : 'text-blue-500'
  return (
    <div className={`flex items-center gap-1.5 text-xs font-bold ${color}`}>
      <span>{done}/{total}</span>
      <span className="text-gray-400 font-normal">steps done</span>
      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
        ${pct === 100 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
        {pct}%
      </span>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AnalyzerPage() {
  // Focus log form state
  const [logs, setLogs] = useState<FocusLog[]>([])
  const [date, setDate] = useState('')
  const [category, setCategory] = useState(TASK_CATEGORIES[0])
  const [focusedMinutes, setFocusedMinutes] = useState('')
  const [distractedMinutes, setDistractedMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)

  // AI analysis state
  const [suggestion, setSuggestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // Save plan state
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Saved plans state
  const [plans, setPlans] = useState<AnalysisPlan[]>([])
  const [showPlans, setShowPlans] = useState(false)

  // Edit plan state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Expanded plan view
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadLogs = useCallback(async () => {
    const res = await fetch('/api/focus-logs')
    if (res.ok) setLogs(await res.json())
  }, [])

  const loadPlans = useCallback(async () => {
    const res = await fetch('/api/analysis-plans')
    if (res.ok) setPlans(await res.json())
  }, [])

  useEffect(() => {
    loadLogs()
    loadPlans()
  }, [loadLogs, loadPlans])

  // ── Log focus session ──────────────────────────────────────────────────────
  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const res = await fetch('/api/focus-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, subject: category, focusedMinutes, distractedMinutes, notes }),
    })
    if (res.ok) {
      setDate(''); setCategory(TASK_CATEGORIES[0]); setFocusedMinutes(''); setDistractedMinutes(''); setNotes('')
      setShowForm(false)
      loadLogs()
    } else {
      const data = await res.json()
      setFormError(data.error || 'Failed to log session')
    }
  }

  // ── Run AI analysis ────────────────────────────────────────────────────────
  async function handleAnalyze() {
    setAiLoading(true)
    setAiError('')
    setSuggestion('')
    setSavedMsg('')
    setShowSaveForm(false)
    try {
      const res = await fetch('/api/ai/focus-analysis')
      const data = await res.json()
      if (res.ok) setSuggestion(data.suggestion)
      else setAiError(data.error || 'Failed to analyze')
    } catch {
      setAiError('Something went wrong. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Save plan ──────────────────────────────────────────────────────────────
  async function handleSavePlan() {
    if (!saveTitle.trim() || !suggestion) return
    setSaving(true)
    setSavedMsg('')
    const checklistItems = extractChecklistItems(suggestion)
    const res = await fetch('/api/analysis-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: saveTitle.trim(),
        content: suggestion,
        checklistItems,
        source: `Focus Analysis — ${logs.length} session${logs.length !== 1 ? 's' : ''}`,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSavedMsg('✅ Plan saved!')
      setSaveTitle('')
      setShowSaveForm(false)
      setShowPlans(true)
      loadPlans()
      setTimeout(() => setSavedMsg(''), 4000)
    }
  }

  // ── Toggle checklist item ──────────────────────────────────────────────────
  async function handleToggleItem(plan: AnalysisPlan, itemId: string) {
    const updated = plan.checklistItems.map(i =>
      i.id === itemId ? { ...i, done: !i.done } : i
    )
    // Optimistic update
    setPlans(prev => prev.map(p => p._id === plan._id ? { ...p, checklistItems: updated } : p))
    await fetch(`/api/analysis-plans/${plan._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistItems: updated }),
    })
  }

  // ── Save edit ──────────────────────────────────────────────────────────────
  async function handleSaveEdit(id: string) {
    setEditSaving(true)
    const res = await fetch(`/api/analysis-plans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, content: editContent }),
    })
    setEditSaving(false)
    if (res.ok) {
      setEditingId(null)
      loadPlans()
    }
  }

  // ── Delete plan ────────────────────────────────────────────────────────────
  async function handleDeletePlan(id: string) {
    await fetch(`/api/analysis-plans/${id}`, { method: 'DELETE' })
    if (expandedId === id) setExpandedId(null)
    if (editingId === id) setEditingId(null)
    loadPlans()
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const overallRatio = logs.length > 0
    ? focusRatio(
        logs.reduce((s, l) => s + l.focusedMinutes, 0),
        logs.reduce((s, l) => s + l.distractedMinutes, 0)
      )
    : null

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Study vs Distraction Analyzer</h1>
          <p className="text-sm text-gray-500 mt-1">Track your focus time vs distraction. Save AI plans and follow your progress.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {plans.length > 0 && (
            <button onClick={() => setShowPlans(v => !v)}
              className="text-xs px-3 py-2 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 transition font-medium">
              {showPlans ? '▲ Hide Plans' : `📋 My Plans (${plans.length})`}
            </button>
          )}
          <button onClick={() => setShowForm(v => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
            {showForm ? '✕ Hide Form' : '+ Log Session'}
          </button>
        </div>
      </div>

      {/* ── Overall Stats Banner ── */}
      {overallRatio !== null && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Overall Focus Ratio ({logs.length} sessions)
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${overallRatio >= 70 ? 'text-green-600' : overallRatio >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {overallRatio}%
              </span>
              <div className="flex-1">
                <FocusBar ratio={overallRatio} />
                <p className="text-xs text-gray-400 mt-1">
                  {overallRatio >= 70 ? '🔥 Great focus! Keep it up.' : overallRatio >= 40 ? '⚡ Decent — room to improve.' : '⚠️ High distraction. Check AI tips below.'}
                </p>
              </div>
            </div>
          </div>
          <div className="text-center sm:text-right shrink-0">
            <p className="text-2xl font-bold text-blue-600">{logs.reduce((s, l) => s + l.focusedMinutes, 0)} min</p>
            <p className="text-xs text-gray-400">total focused</p>
          </div>
        </div>
      )}

      {/* ── Log Form ── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Log a Focus Session</h2>
          <form onSubmit={handleLog} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Task Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                  {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-3">
                <label className="block text-xs font-bold text-green-600 uppercase tracking-wide mb-2">🟢 Focused Minutes</label>
                <input type="number" min="0" value={focusedMinutes} onChange={e => setFocusedMinutes(e.target.value)} required
                  placeholder="e.g. 45"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <label className="block text-xs font-bold text-red-500 uppercase tracking-wide mb-2">🔴 Distracted Minutes</label>
                <input type="number" min="0" value={distractedMinutes} onChange={e => setDistractedMinutes(e.target.value)} required
                  placeholder="e.g. 15"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
            {focusedMinutes && distractedMinutes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Focus ratio for this session:</p>
                <div className="flex items-center gap-3">
                  <RatioBadge ratio={focusRatio(Number(focusedMinutes), Number(distractedMinutes))} />
                  <FocusBar ratio={focusRatio(Number(focusedMinutes), Number(distractedMinutes))} />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes (optional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Phone notifications were distracting"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            {formError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
            <button type="submit"
              className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition">
              Log Session
            </button>
          </form>
        </div>
      )}

      {/* ── Log History ── */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          📊 Focus Log History
          {logs.length > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{logs.length} logged</span>}
        </h2>
        {logs.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-xl">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-gray-500 text-sm">No focus logs yet.</p>
            <p className="text-gray-400 text-xs mt-1">Log your first session above to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => {
              const ratio = focusRatio(log.focusedMinutes, log.distractedMinutes)
              return (
                <div key={log._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800">{log.subject}</p>
                        <RatioBadge ratio={ratio} />
                      </div>
                      <p className="text-xs text-gray-400">{log.date}</p>
                      {log.notes && <p className="text-xs text-gray-400 italic mt-1">"{log.notes}"</p>}
                      <FocusBar ratio={ratio} />
                    </div>
                    <div className="flex gap-4 text-sm shrink-0 sm:text-right">
                      <div className="text-center">
                        <p className="font-bold text-green-600">{log.focusedMinutes}</p>
                        <p className="text-xs text-gray-400">focused</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-red-500">{log.distractedMinutes}</p>
                        <p className="text-xs text-gray-400">distracted</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── AI Analysis Section ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-700">🎯 AI Focus Analysis</h2>
            <p className="text-xs text-gray-400 mt-0.5">AI reviews your focus patterns and gives personalized coaching.</p>
          </div>
          <button onClick={handleAnalyze} disabled={aiLoading}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition shrink-0">
            {aiLoading ? <><span className="animate-spin inline-block">⟳</span> Analyzing...</> : '🎯 Get AI Analysis'}
          </button>
        </div>

        {aiError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{aiError}</p>}

        {suggestion && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 space-y-4">
            {/* AI header + Save button row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg">🎯</span>
                <p className="text-xs font-bold text-green-700 uppercase tracking-widest">AI Feedback</p>
              </div>
              <div className="flex items-center gap-2">
                {savedMsg && (
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">{savedMsg}</span>
                )}
                <button onClick={() => setShowSaveForm(v => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition
                    bg-white border-green-300 text-green-700 hover:bg-green-50">
                  {showSaveForm ? '✕ Cancel' : '💾 Save This Plan'}
                </button>
              </div>
            </div>

            {/* Save form */}
            {showSaveForm && (
              <div className="bg-white border border-green-200 rounded-xl px-4 py-3 space-y-3">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Save AI Plan to Your Collection</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={e => setSaveTitle(e.target.value)}
                    placeholder="Give this plan a name (e.g. Week 2 Focus Boost)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button onClick={handleSavePlan} disabled={saving || !saveTitle.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition whitespace-nowrap">
                    {saving ? '...' : '💾 Save'}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  💡 AI steps will be automatically extracted as a checklist so you can track your progress.
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
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              📋 My Saved AI Plans
              <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{plans.length} saved</span>
            </h2>
            <button onClick={() => setShowPlans(false)}
              className="text-xs text-gray-400 hover:text-gray-600 transition">
              ✕ Hide
            </button>
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-2xl">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-gray-500 text-sm">No saved plans yet.</p>
              <p className="text-gray-400 text-xs mt-1">Generate an AI analysis and click "Save This Plan".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map(plan => {
                const doneCount = plan.checklistItems.filter(i => i.done).length
                const totalCount = plan.checklistItems.length
                const isExpanded = expandedId === plan._id
                const isEditing = editingId === plan._id

                return (
                  <div key={plan._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                    {/* Plan header */}
                    <div className="px-5 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              className="w-full border border-purple-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                          ) : (
                            <p className="font-bold text-gray-800 truncate">{plan.title}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400">{plan.source}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">
                              {new Date(plan.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {totalCount > 0 && !isEditing && (
                            <div className="mt-2">
                              <ProgressRing done={doneCount} total={totalCount} />
                              {/* Mini progress bar */}
                              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${doneCount === totalCount ? 'bg-green-500' : 'bg-purple-500'}`}
                                  style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 shrink-0 flex-wrap">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSaveEdit(plan._id)} disabled={editSaving}
                                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-semibold">
                                {editSaving ? '...' : '✓ Save'}
                              </button>
                              <button onClick={() => setEditingId(null)}
                                className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setExpandedId(isExpanded ? null : plan._id)}
                                className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                                {isExpanded ? '▲ Close' : '▶ View'}
                              </button>
                              <button onClick={() => {
                                setEditingId(plan._id)
                                setEditTitle(plan.title)
                                setEditContent(plan.content)
                                setExpandedId(null)
                              }}
                                className="text-xs border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
                                ✏️ Edit
                              </button>
                              <button onClick={() => handleDeletePlan(plan._id)}
                                className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit mode — markdown editor */}
                    {isEditing && (
                      <div className="border-t border-purple-100 bg-purple-50 px-5 py-4 space-y-3">
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Edit Plan Content (Markdown)</p>
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          rows={14}
                          className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y"
                        />
                        <p className="text-xs text-gray-400">You can edit the AI content or add your own notes in Markdown.</p>
                      </div>
                    )}

                    {/* Expanded: checklist + full content */}
                    {isExpanded && !isEditing && (
                      <div className="border-t border-gray-100">

                        {/* Checklist tracking panel */}
                        {plan.checklistItems.length > 0 && (
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 px-5 py-4 border-b border-purple-100">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-bold text-purple-700 uppercase tracking-widest">
                                ✅ Action Checklist — Are You Following This Plan?
                              </p>
                              {doneCount === totalCount && totalCount > 0 && (
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  🎉 All done!
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {plan.checklistItems.map(item => (
                                <label
                                  key={item.id}
                                  className={`flex items-start gap-3 cursor-pointer group rounded-xl px-3 py-2.5 transition
                                    ${item.done ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50'}`}
                                >
                                  <div className="relative mt-0.5 shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={item.done}
                                      onChange={() => handleToggleItem(plan, item.id)}
                                      className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition
                                      ${item.done
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-300 group-hover:border-purple-400'}`}>
                                      {item.done && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`text-sm leading-snug transition ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                    {item.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                            {/* Completion encouragement */}
                            {doneCount > 0 && doneCount < totalCount && (
                              <p className="text-xs text-purple-600 font-medium mt-3">
                                🔥 {doneCount} of {totalCount} steps done — keep going!
                              </p>
                            )}
                            {doneCount === 0 && (
                              <p className="text-xs text-gray-400 mt-3">
                                💡 Check off steps as you implement each recommendation.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Full AI plan content */}
                        <div className="bg-gray-50 px-5 py-4">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Full AI Analysis</p>
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
