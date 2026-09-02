'use client'

import { useState } from 'react'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

const TOPICS = [
  'Arrays & Strings','Linked Lists','Trees & Graphs','Dynamic Programming',
  'System Design','OS Concepts','Networking','Databases','React/Frontend',
  'Node.js/Backend','Data Structures','Behavioral Questions','SQL','REST & APIs',
]

interface Topic { id: string; name: string; status: 'not started' | 'in progress' | 'done'; notes: string }
interface SavedAIPlan {
  id: string; title: string; content: string
  steps: { id: string; text: string; done: boolean }[]
  savedAt: string
}

const statusConfig = {
  'not started': { color: 'bg-gray-700/80 text-gray-400 border-gray-600',           dot: 'bg-gray-500' },
  'in progress': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',  dot: 'bg-yellow-400' },
  'done':        { color: 'bg-green-500/20 text-green-400 border-green-500/30',     dot: 'bg-green-400' },
}

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

function loadTopics(): Topic[] {
  if (typeof window === 'undefined') return []
  const s = localStorage.getItem('interview_topics')
  if (s) return JSON.parse(s)
  return TOPICS.map((name, i) => ({ id: String(i), name, status: 'not started' as const, notes: '' }))
}

function loadPlans(): SavedAIPlan[] {
  if (typeof window === 'undefined') return []
  const s = localStorage.getItem('interview_ai_plans')
  return s ? JSON.parse(s) : []
}

function Ring({ done, total }: { done: number; total: number }) {
  if (total === 0) return null
  const pct = done / total
  const r = 16, circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-2">
      <svg width="38" height="38" viewBox="0 0 38 38" className="-rotate-90">
        <circle cx="19" cy="19" r={r} fill="none" stroke="#374151" strokeWidth="3.5" />
        <circle cx="19" cy="19" r={r} fill="none" stroke={pct === 1 ? '#34d399' : '#22c55e'} strokeWidth="3.5"
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

export default function InterviewPrepPage() {
  const [topics, setTopics]   = useState<Topic[]>(loadTopics)
  const [plans, setPlans]     = useState<SavedAIPlan[]>(loadPlans)
  const [aiPlan, setAiPlan]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [customTopic, setCustomTopic] = useState('')

  // save/edit plan state
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveTitle, setSaveTitle]       = useState('')
  const [savedMsg, setSavedMsg]         = useState('')
  const [showPlans, setShowPlans]       = useState(false)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [editingPlan, setEditingPlan]   = useState<string | null>(null)
  const [editTitle, setEditTitle]       = useState('')
  const [editContent, setEditContent]   = useState('')

  function saveTopics(updated: Topic[]) { setTopics(updated); localStorage.setItem('interview_topics', JSON.stringify(updated)) }
  function savePlans(updated: SavedAIPlan[]) { setPlans(updated); localStorage.setItem('interview_ai_plans', JSON.stringify(updated)) }

  function cycleStatus(id: string) {
    const order: Topic['status'][] = ['not started', 'in progress', 'done']
    saveTopics(topics.map(t => t.id === id ? { ...t, status: order[(order.indexOf(t.status) + 1) % 3] } : t))
  }

  function updateNotes(id: string, notes: string) {
    saveTopics(topics.map(t => t.id === id ? { ...t, notes } : t))
  }

  function addCustom(e: React.FormEvent) {
    e.preventDefault()
    if (!customTopic.trim()) return
    saveTopics([...topics, { id: Date.now().toString(), name: customTopic, status: 'not started', notes: '' }])
    setCustomTopic('')
  }

  async function getAIPlan() {
    setAiLoading(true); setAiPlan(''); setShowSaveForm(false)
    const notStarted = topics.filter(t => t.status === 'not started').map(t => t.name)
    const inProgress = topics.filter(t => t.status === 'in progress').map(t => t.name)
    const done = topics.filter(t => t.status === 'done').map(t => t.name)
    try {
      const res = await fetch('/api/ai/interview-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notStarted, inProgress, done }),
      })
      const data = await res.json()
      setAiPlan(data.suggestion)
    } catch { setAiPlan('Failed to generate plan.') }
    setAiLoading(false)
  }

  function handleSavePlan() {
    if (!saveTitle.trim() || !aiPlan) return
    const plan: SavedAIPlan = {
      id: Date.now().toString(), title: saveTitle.trim(), content: aiPlan,
      steps: parseSteps(aiPlan),
      savedAt: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
    }
    savePlans([plan, ...plans])
    setSaveTitle(''); setShowSaveForm(false); setShowPlans(true)
    setSavedMsg('Plan saved!'); setTimeout(() => setSavedMsg(''), 3000)
  }

  function toggleStep(planId: string, stepId: string) {
    savePlans(plans.map(p => p.id !== planId ? p : {
      ...p, steps: p.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s),
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

  const doneCount  = topics.filter(t => t.status === 'done').length
  const inProgCount = topics.filter(t => t.status === 'in progress').length
  const pct = Math.round((doneCount / topics.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Dev Zone</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Interview Prep</h1>
          <p className="text-sm text-gray-400 mt-1">Track interview topics. AI creates your prioritized study plan.</p>
        </div>
        {plans.length > 0 && (
          <button onClick={() => setShowPlans(v => !v)}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0">
            {showPlans ? 'Hide Plans' : `Saved Plans (${plans.length})`}
          </button>
        )}
      </div>

      {/* Progress card */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-200">Overall Progress</p>
          <span className="text-xl font-bold text-green-400">{pct}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-3">
          <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-5 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /><span className="text-gray-400">{doneCount} done</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /><span className="text-gray-400">{inProgCount} in progress</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /><span className="text-gray-400">{topics.length - doneCount - inProgCount} not started</span></span>
        </div>
      </div>

      {/* ── AI Plan Section ── */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-200">AI Study Order</h2>
            <p className="text-xs text-gray-500 mt-0.5">AI creates a prioritized plan based on your current progress.</p>
          </div>
          <button onClick={getAIPlan} disabled={aiLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 transition shrink-0">
            {aiLoading ? 'Planning...' : 'Generate Plan'}
          </button>
        </div>

        {aiPlan && (
          <div className="border-t border-gray-700/50">
            {/* Action bar */}
            <div className="px-5 py-3 bg-gray-800/80 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs font-bold text-green-400 uppercase tracking-widest">AI Study Plan</p>
              <div className="flex items-center gap-2">
                {savedMsg && <span className="text-xs text-green-400 font-semibold">{savedMsg}</span>}
                <button onClick={() => setShowSaveForm(v => !v)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 px-3 py-1.5 rounded-lg transition font-semibold">
                  {showSaveForm ? 'Cancel' : 'Save Plan'}
                </button>
              </div>
            </div>
            {showSaveForm && (
              <div className="px-5 py-3 bg-gray-800/60 border-b border-gray-700/50 flex gap-2">
                <input type="text" value={saveTitle} onChange={e => setSaveTitle(e.target.value)}
                  placeholder="Plan title (e.g. Interview Roadmap Jan)"
                  className="flex-1 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button onClick={handleSavePlan} disabled={!saveTitle.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40 transition">
                  Save
                </button>
              </div>
            )}
            <div className="px-5 py-4 bg-green-500/5">
              <MarkdownRenderer content={aiPlan} />
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
            const dc = plan.steps.filter(s => s.done).length
            const tot = plan.steps.length
            const allDone = tot > 0 && dc === tot
            const isOpen = expandedPlan === plan.id
            const isEdit = editingPlan === plan.id
            return (
              <div key={plan.id} className={`bg-gray-800/60 border rounded-2xl overflow-hidden transition ${allDone ? 'border-green-500/40' : 'border-gray-700/50'}`}>
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {isEdit
                        ? <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                        : <p className="font-semibold text-sm text-gray-100 truncate">{plan.title}</p>}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-600">{plan.savedAt}</span>
                        {tot > 0 && !isEdit && (
                          <>
                            <span className="text-gray-700">·</span>
                            <Ring done={dc} total={tot} />
                            <div className="flex-1 min-w-[80px]">
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all ${allDone ? 'bg-green-400' : 'bg-green-600'}`}
                                  style={{ width: `${(dc / tot) * 100}%` }} />
                              </div>
                            </div>
                            {allDone && <span className="text-xs font-bold text-green-400">All done!</span>}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0 flex-wrap">
                      {isEdit ? (
                        <>
                          <button onClick={() => saveEdit(plan.id)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition font-semibold">Save</button>
                          <button onClick={() => setEditingPlan(null)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-600 transition">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setExpandedPlan(isOpen ? null : plan.id)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-600 transition">
                            {isOpen ? 'Close' : 'View'}
                          </button>
                          <button onClick={() => { setEditingPlan(plan.id); setEditTitle(plan.title); setEditContent(plan.content); setExpandedPlan(null) }}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-600 transition">Edit</button>
                          <button onClick={() => deletePlan(plan.id)}
                            className="text-xs text-red-500 hover:text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition">Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {isEdit && (
                  <div className="border-t border-gray-700/50 bg-gray-800/80 px-4 py-3 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Edit Plan Content (Markdown)</p>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={10}
                      className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-500 resize-y" />
                    <p className="text-xs text-gray-600">Editing resets checklist progress.</p>
                  </div>
                )}
                {isOpen && !isEdit && (
                  <div className="border-t border-gray-700/50">
                    {plan.steps.length > 0 && (
                      <div className="px-4 py-3 bg-green-500/5 border-b border-gray-700/30">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Action Steps — Track Your Progress</p>
                          <button onClick={() => markAllSteps(plan.id, dc < tot)}
                            className="text-xs text-gray-400 hover:text-gray-200 border border-gray-600 px-2.5 py-1 rounded-lg transition">
                            {dc === tot ? 'Clear All' : 'Mark All Done'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {plan.steps.map((step, idx) => (
                            <label key={step.id}
                              className={`flex items-start gap-3 cursor-pointer rounded-xl px-3 py-2.5 border transition group
                                ${step.done ? 'bg-green-500/10 border-green-500/20' : 'bg-gray-800/60 border-gray-700/50 hover:border-green-500/30 hover:bg-green-500/5'}`}>
                              <div className="relative mt-0.5 shrink-0">
                                <input type="checkbox" checked={step.done} onChange={() => toggleStep(plan.id, step.id)} className="sr-only" />
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition
                                  ${step.done ? 'bg-green-500 border-green-500' : 'border-gray-600 group-hover:border-green-400'}`}>
                                  {step.done && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`text-[10px] font-bold shrink-0 ${step.done ? 'text-green-500' : 'text-gray-600'}`}>{idx + 1}.</span>
                                <span className={`text-sm leading-snug ${step.done ? 'line-through text-gray-500' : 'text-gray-300'}`}>{step.text}</span>
                              </div>
                              {step.done && <span className="text-[10px] font-bold text-green-500 shrink-0">Done</span>}
                            </label>
                          ))}
                        </div>
                        {dc > 0 && !allDone && <p className="text-xs text-green-400 mt-2">{dc}/{tot} steps complete — keep going!</p>}
                      </div>
                    )}
                    <div className="px-4 py-4 bg-gray-800/40"><MarkdownRenderer content={plan.content} /></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add custom topic */}
      <form onSubmit={addCustom} className="flex gap-2">
        <input type="text" value={customTopic} onChange={e => setCustomTopic(e.target.value)}
          placeholder="Add custom topic (e.g. Redis, Docker, Kubernetes)"
          className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <button type="submit"
          className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-xl text-sm font-semibold transition border border-gray-600">
          + Add
        </button>
      </form>

      {/* Topics list */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">All Topics — Click Status to Cycle</p>
        {topics.map(t => {
          const cfg = statusConfig[t.status]
          return (
            <div key={t.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 hover:border-gray-600 transition">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                <button onClick={() => cycleStatus(t.id)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 transition cursor-pointer ${cfg.color}`}>
                  {t.status}
                </button>
                <p className="font-medium text-sm text-gray-100 flex-1">{t.name}</p>
              </div>
              <input type="text" value={t.notes} onChange={e => updateNotes(t.id, e.target.value)}
                placeholder="Add notes..."
                className="mt-2 w-full bg-transparent border-0 border-b border-gray-700 text-xs text-gray-400 placeholder-gray-600 py-1 focus:outline-none focus:border-green-500" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
