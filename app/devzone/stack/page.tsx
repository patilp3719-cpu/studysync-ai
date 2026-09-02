'use client'

import { useState } from 'react'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

interface StackEntry {
  id: string
  tech: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  notes: string
}

interface SavedAIPlan {
  id: string
  title: string
  content: string
  steps: { id: string; text: string; done: boolean }[]
  savedAt: string
}

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'DevOps', 'Mobile', 'AI/ML', 'Tools', 'Languages']

const levelConfig = {
  beginner:     { color: 'bg-green-500/20 text-green-400 border-green-500/30',   dot: 'bg-green-400' },
  intermediate: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-400' },
  advanced:     { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',      dot: 'bg-blue-400' },
}

// ── Parse numbered/bullet list items from markdown ────────────────────────────
function parseSteps(md: string): { id: string; text: string; done: boolean }[] {
  const steps: { id: string; text: string; done: boolean }[] = []
  for (const line of md.split('\n')) {
    const m = line.trim().match(/^\d+\.\s+(.+)/) || line.trim().match(/^[-*]\s+(.+)/)
    if (m) {
      const text = m[1].replace(/\*\*/g, '').replace(/`/g, '').trim()
      if (text.length > 4 && text.length < 200)
        steps.push({ id: `s${steps.length}`, text, done: false })
    }
  }
  return steps.slice(0, 15)
}

function loadEntries(): StackEntry[] {
  if (typeof window === 'undefined') return []
  const s = localStorage.getItem('tech_stack')
  return s ? JSON.parse(s) : []
}

function loadPlans(): SavedAIPlan[] {
  if (typeof window === 'undefined') return []
  const s = localStorage.getItem('stack_ai_plans')
  return s ? JSON.parse(s) : []
}

// ── Circular progress SVG ─────────────────────────────────────────────────────
function Ring({ done, total }: { done: number; total: number }) {
  if (total === 0) return null
  const pct = done / total
  const r = 16, circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-2">
      <svg width="38" height="38" viewBox="0 0 38 38" className="-rotate-90">
        <circle cx="19" cy="19" r={r} fill="none" stroke="#374151" strokeWidth="3.5" />
        <circle cx="19" cy="19" r={r} fill="none" stroke={pct === 1 ? '#34d399' : '#ea580c'} strokeWidth="3.5"
          strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.4s ease' }} />
      </svg>
      <div className="leading-tight">
        <p className="text-xs font-bold text-gray-300">{done}/{total}</p>
        <p className="text-[10px] text-gray-500">done</p>
      </div>
    </div>
  )
}

export default function TechStackPage() {
  const [entries, setEntries] = useState<StackEntry[]>(loadEntries)
  const [tech, setTech] = useState('')
  const [category, setCategory] = useState('Frontend')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [aiResources, setAiResources] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [filterCat, setFilterCat] = useState('All')

  // AI plan save/edit state
  const [plans, setPlans] = useState<SavedAIPlan[]>(loadPlans)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [showPlans, setShowPlans] = useState(false)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  function saveEntries(updated: StackEntry[]) {
    setEntries(updated)
    localStorage.setItem('tech_stack', JSON.stringify(updated))
  }

  function savePlans(updated: SavedAIPlan[]) {
    setPlans(updated)
    localStorage.setItem('stack_ai_plans', JSON.stringify(updated))
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const entry: StackEntry = { id: Date.now().toString(), tech, category, level, notes }
    saveEntries([entry, ...entries])
    setTech(''); setNotes(''); setShowForm(false)
  }

  async function getResources() {
    setAiLoading(true); setAiResources(''); setShowSaveForm(false)
    const summary = entries.map(e => `${e.tech} (${e.category}, ${e.level})`).join(', ')
    try {
      const res = await fetch('/api/ai/stack-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stack: summary }),
      })
      const data = await res.json()
      setAiResources(data.suggestion)
    } catch { setAiResources('Failed to load resources.') }
    setAiLoading(false)
  }

  function handleSavePlan() {
    if (!saveTitle.trim() || !aiResources) return
    const plan: SavedAIPlan = {
      id: Date.now().toString(),
      title: saveTitle.trim(),
      content: aiResources,
      steps: parseSteps(aiResources),
      savedAt: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
    }
    savePlans([plan, ...plans])
    setSaveTitle(''); setShowSaveForm(false); setShowPlans(true)
    setSavedMsg('Plan saved!'); setTimeout(() => setSavedMsg(''), 3000)
  }

  function toggleStep(planId: string, stepId: string) {
    savePlans(plans.map(p => p.id !== planId ? p : {
      ...p,
      steps: p.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s),
    }))
  }

  function markAllSteps(planId: string, done: boolean) {
    savePlans(plans.map(p => p.id !== planId ? p : { ...p, steps: p.steps.map(s => ({ ...s, done })) }))
  }

  function saveEdit(id: string) {
    savePlans(plans.map(p => p.id !== id ? p : { ...p, title: editTitle, content: editContent, steps: parseSteps(editContent) }))
    setEditingPlan(null)
  }

  function deletePlan(id: string) {
    savePlans(plans.filter(p => p.id !== id))
    if (expandedPlan === id) setExpandedPlan(null)
    if (editingPlan === id) setEditingPlan(null)
  }

  const filtered = filterCat === 'All' ? entries : entries.filter(e => e.category === filterCat)

  const inputCls = 'w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
  const selectCls = 'w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'
  const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5'

  // Stats by level
  const begCount  = entries.filter(e => e.level === 'beginner').length
  const intCount  = entries.filter(e => e.level === 'intermediate').length
  const advCount  = entries.filter(e => e.level === 'advanced').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Dev Zone</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Tech Stack Notes</h1>
          <p className="text-sm text-gray-400 mt-1">Document your skills. AI recommends what to learn next.</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {plans.length > 0 && (
            <button onClick={() => setShowPlans(v => !v)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 px-3 py-2 rounded-xl text-xs font-semibold transition">
              {showPlans ? 'Hide Plans' : `Saved Plans (${plans.length})`}
            </button>
          )}
          <button onClick={() => setShowForm(v => !v)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0">
            {showForm ? 'Hide Form' : '+ Add Tech'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',        value: entries.length, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Beginner',     value: begCount,       color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Intermediate', value: intCount,       color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Advanced',     value: advCount,       color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Stack bubble overview */}
      {entries.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Your Stack ({entries.length} technologies)</p>
          <div className="flex flex-wrap gap-2">
            {entries.map(e => (
              <span key={e.id} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${levelConfig[e.level].color}`}>
                {e.tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-gray-300 mb-4">Add Technology</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Technology *</label>
                <input type="text" value={tech} onChange={e => setTech(e.target.value)} required
                  placeholder="e.g. React, PostgreSQL, Docker" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Level</label>
                <select value={level} onChange={e => setLevel(e.target.value as any)} className={selectCls}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Used in 3 projects" className={inputCls} />
              </div>
            </div>
            <button type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl text-sm font-bold transition">
              Add to Stack
            </button>
          </form>
        </div>
      )}

      {/* ── AI Learning Resources Section ── */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-200">AI Learning Resources</h2>
            <p className="text-xs text-gray-500 mt-0.5">AI analyses your stack and recommends what to learn next.</p>
          </div>
          <button onClick={getResources} disabled={aiLoading || entries.length === 0}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 transition shrink-0">
            {aiLoading ? 'Analyzing...' : 'Get Resources'}
          </button>
        </div>

        {aiResources && (
          <div className="border-t border-gray-700/50">
            {/* Action bar */}
            <div className="px-5 py-3 bg-gray-800/80 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">AI Resources</p>
              <div className="flex items-center gap-2">
                {savedMsg && <span className="text-xs text-green-400 font-semibold">{savedMsg}</span>}
                <button onClick={() => setShowSaveForm(v => !v)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 px-3 py-1.5 rounded-lg transition font-semibold">
                  {showSaveForm ? 'Cancel' : 'Save Plan'}
                </button>
              </div>
            </div>

            {/* Save form */}
            {showSaveForm && (
              <div className="px-5 py-3 bg-gray-800/60 border-b border-gray-700/50 flex gap-2">
                <input type="text" value={saveTitle} onChange={e => setSaveTitle(e.target.value)}
                  placeholder="Plan title (e.g. Q1 Learning Roadmap)"
                  className="flex-1 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <button onClick={handleSavePlan} disabled={!saveTitle.trim()}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40 transition">
                  Save
                </button>
              </div>
            )}

            {/* AI content */}
            <div className="px-5 py-4 bg-orange-500/5">
              <MarkdownRenderer content={aiResources} />
            </div>
          </div>
        )}
      </div>

      {/* ── Saved Plans ── */}
      {showPlans && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-300">Saved AI Plans <span className="text-gray-600 font-normal">({plans.length})</span></h2>
            <button onClick={() => setShowPlans(false)} className="text-xs text-gray-600 hover:text-gray-400 transition">Hide</button>
          </div>
          {plans.map(plan => {
            const doneCount = plan.steps.filter(s => s.done).length
            const total = plan.steps.length
            const allDone = total > 0 && doneCount === total
            const isOpen = expandedPlan === plan.id
            const isEdit = editingPlan === plan.id
            return (
              <div key={plan.id} className={`bg-gray-800/60 border rounded-2xl overflow-hidden transition ${allDone ? 'border-orange-500/40' : 'border-gray-700/50'}`}>
                {/* Plan header */}
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {isEdit
                        ? <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                        : <p className="font-semibold text-sm text-gray-100 truncate">{plan.title}</p>}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-600">{plan.savedAt}</span>
                        {total > 0 && !isEdit && (
                          <>
                            <span className="text-gray-700">·</span>
                            <Ring done={doneCount} total={total} />
                            <div className="flex-1 min-w-[80px]">
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all ${allDone ? 'bg-orange-400' : 'bg-orange-600'}`}
                                  style={{ width: `${(doneCount / total) * 100}%` }} />
                              </div>
                            </div>
                            {allDone && <span className="text-xs font-bold text-orange-400">All done!</span>}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0 flex-wrap">
                      {isEdit ? (
                        <>
                          <button onClick={() => saveEdit(plan.id)}
                            className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition font-semibold">
                            Save
                          </button>
                          <button onClick={() => setEditingPlan(null)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition border border-gray-600">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setExpandedPlan(isOpen ? null : plan.id)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition border border-gray-600">
                            {isOpen ? 'Close' : 'View'}
                          </button>
                          <button onClick={() => { setEditingPlan(plan.id); setEditTitle(plan.title); setEditContent(plan.content); setExpandedPlan(null) }}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition border border-gray-600">
                            Edit
                          </button>
                          <button onClick={() => deletePlan(plan.id)}
                            className="text-xs text-red-500 hover:text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition">
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit mode */}
                {isEdit && (
                  <div className="border-t border-gray-700/50 bg-gray-800/80 px-4 py-3 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Edit Plan Content (Markdown)</p>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={10}
                      className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-y" />
                    <p className="text-xs text-gray-600">Editing resets checklist progress.</p>
                  </div>
                )}

                {/* Expanded: checklist + content */}
                {isOpen && !isEdit && (
                  <div className="border-t border-gray-700/50">
                    {plan.steps.length > 0 && (
                      <div className="px-4 py-3 bg-orange-500/5 border-b border-gray-700/30">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Action Steps — Track Your Progress</p>
                          <button onClick={() => markAllSteps(plan.id, doneCount < total)}
                            className="text-xs text-gray-400 hover:text-gray-200 border border-gray-600 px-2.5 py-1 rounded-lg transition">
                            {doneCount === total ? 'Clear All' : 'Mark All Done'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {plan.steps.map((step, idx) => (
                            <label key={step.id}
                              className={`flex items-start gap-3 cursor-pointer rounded-xl px-3 py-2.5 border transition group
                                ${step.done
                                  ? 'bg-orange-500/10 border-orange-500/20'
                                  : 'bg-gray-800/60 border-gray-700/50 hover:border-orange-500/40 hover:bg-orange-500/5'}`}>
                              <div className="relative mt-0.5 shrink-0">
                                <input type="checkbox" checked={step.done} onChange={() => toggleStep(plan.id, step.id)} className="sr-only" />
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition
                                  ${step.done ? 'bg-orange-500 border-orange-500' : 'border-gray-600 group-hover:border-orange-400'}`}>
                                  {step.done && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`text-[10px] font-bold shrink-0 ${step.done ? 'text-orange-500' : 'text-gray-600'}`}>{idx + 1}.</span>
                                <span className={`text-sm leading-snug ${step.done ? 'line-through text-gray-500' : 'text-gray-300'}`}>{step.text}</span>
                              </div>
                              {step.done && <span className="text-[10px] font-bold text-orange-500 shrink-0">Done</span>}
                            </label>
                          ))}
                        </div>
                        {doneCount > 0 && !allDone && (
                          <p className="text-xs text-orange-400 mt-2">{doneCount}/{total} steps complete — keep going!</p>
                        )}
                      </div>
                    )}
                    <div className="px-4 py-4 bg-gray-800/40">
                      <MarkdownRenderer content={plan.content} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Filter + list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-300">Technologies <span className="text-gray-500 font-normal">({filtered.length})</span></h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                filterCat === c
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-orange-500/50 hover:text-gray-200'
              }`}>
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-gray-800/40 border border-dashed border-gray-700 rounded-2xl">
            <p className="text-gray-400 text-sm font-medium">No technologies added yet.</p>
            <p className="text-gray-600 text-xs mt-1">Click "+ Add Tech" to document your stack.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(e => (
              <div key={e.id}
                className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 flex items-center gap-3 hover:border-gray-600 transition">
                <span className={`w-2 h-2 rounded-full shrink-0 ${levelConfig[e.level].dot}`} />
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${levelConfig[e.level].color}`}>
                  {e.level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-100">{e.tech}</p>
                  <p className="text-xs text-gray-500">{e.category}{e.notes ? ` · ${e.notes}` : ''}</p>
                </div>
                <button onClick={() => saveEntries(entries.filter(x => x.id !== e.id))}
                  className="text-gray-600 hover:text-red-400 transition text-xs shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
