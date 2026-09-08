'use client'

import { useEffect, useState } from 'react'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

const TASK_CATEGORIES = [
  'DSA / Algorithms', 'Web Development', 'System Design', 'Machine Learning / AI',
  'Database / SQL', 'DevOps / Cloud', 'Mobile Development', 'Open Source',
  'Project Work', 'Interview Prep', 'Reading / Research', 'Other',
]

interface Task {
  _id: string; title: string; category: string; course?: string
  dueDate: string; priority: 'low' | 'medium' | 'high'; status: 'pending' | 'done'
}

interface SavedPlan {
  _id: string; title: string; days: number; tasks: string; content: string; createdAt: string
}

const priorityStyle: Record<string, React.CSSProperties> = {
  low:    { background: 'rgba(16,185,129,0.15)',  color: '#10B981',  border: '1px solid rgba(16,185,129,0.3)'  },
  medium: { background: 'rgba(245,158,11,0.15)',  color: '#F59E0B',  border: '1px solid rgba(245,158,11,0.3)'  },
  high:   { background: 'rgba(239,68,68,0.15)',   color: '#EF4444',  border: '1px solid rgba(239,68,68,0.3)'   },
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(19,27,46,0.7)',
  border: '1px solid rgba(51,65,85,0.4)',
  borderRadius: '0.75rem',
  padding: '1.25rem',
}

const inputCls = {
  style: {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(51,65,85,0.6)',
    color: '#dfe2ee',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  } as React.CSSProperties,
}

export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(TASK_CATEGORIES[0])
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [days, setDays] = useState(7)
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([])
  const [savingPlan, setSavingPlan] = useState(false)
  const [planSaved, setPlanSaved] = useState(false)
  const [planTitle, setPlanTitle] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [viewingPlan, setViewingPlan] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadTasks() {
    const res = await fetch('/api/tasks')
    if (res.ok) setTasks(await res.json())
  }
  async function loadSavedPlans() {
    const res = await fetch('/api/saved-plans')
    if (res.ok) setSavedPlans(await res.json())
  }
  useEffect(() => { loadTasks(); loadSavedPlans() }, [])

  function getTimezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'Asia/Kolkata' }
  }

  async function handleSavePlan() {
    if (!planTitle.trim()) return
    setSavingPlan(true)
    const taskSnapshot = tasks.filter(t => t.status === 'pending').map(t => t.title).join(', ')
    const res = await fetch('/api/saved-plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: planTitle, days, tasks: taskSnapshot, content: suggestion }),
    })
    setSavingPlan(false)
    if (res.ok) { setPlanSaved(true); setShowSaveForm(false); setPlanTitle(''); loadSavedPlans(); setTimeout(() => setPlanSaved(false), 3000) }
  }

  async function handleUpdatePlan(id: string) {
    setSaving(true)
    const res = await fetch(`/api/saved-plans/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent, title: editTitle }),
    })
    setSaving(false)
    if (res.ok) { setEditingPlan(null); loadSavedPlans() }
  }

  async function handleDeletePlan(id: string) {
    await fetch(`/api/saved-plans/${id}`, { method: 'DELETE' })
    if (viewingPlan === id) setViewingPlan(null)
    if (editingPlan === id) setEditingPlan(null)
    loadSavedPlans()
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault(); setFormError('')
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, dueDate, priority }),
      })
      if (res.ok) { setTitle(''); setCategory(TASK_CATEGORIES[0]); setDueDate(''); setPriority('medium'); setShowForm(false); loadTasks() }
      else {
        let errorMsg = 'Failed to add task'
        try { const data = await res.json(); errorMsg = data.error || errorMsg } catch { errorMsg = res.statusText || `Server error (${res.status})` }
        setFormError(errorMsg)
      }
    } catch { setFormError('Network error — please check your connection.') }
  }

  async function handleToggle(id: string) { await fetch(`/api/tasks/${id}`, { method: 'PATCH' }); loadTasks() }
  async function handleDelete(id: string) { await fetch(`/api/tasks/${id}`, { method: 'DELETE' }); loadTasks() }

  async function handleGenerateSchedule() {
    setAiLoading(true); setAiError(''); setSuggestion('')
    try {
      const res = await fetch(`/api/ai/schedule?days=${days}&tz=${encodeURIComponent(getTimezone())}`)
      const data = await res.json()
      if (res.ok) setSuggestion(data.suggestion)
      else setAiError(data.error || 'Failed to generate schedule')
    } catch { setAiError('Something went wrong. Please try again.') }
    finally { setAiLoading(false) }
  }

  const btnBase: React.CSSProperties = { cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', borderRadius: '0.5rem', padding: '0.5rem 1rem', transition: 'all 0.15s', border: 'none' }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#dfe2ee' }}>AI Task Planner</h1>
          <p className="text-sm mt-1" style={{ color: '#958ea0' }}>Manage dev tasks and generate AI-powered time-aware schedules.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ ...btnBase, background: showForm ? 'rgba(255,255,255,0.07)' : '#8B5CF6', color: showForm ? '#cbc3d7' : '#fff' }}>
          {showForm ? '✕ Hide Form' : '+ Add Task'}
        </button>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div style={cardStyle}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#958ea0' }}>New Task</p>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Task Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder="e.g. Solve 10 LeetCode medium problems" {...inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} required {...inputCls}>
                  {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Due Date *</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required {...inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')} {...inputCls}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            {formError && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ffb4ab', border: '1px solid rgba(239,68,68,0.3)' }}>{formError}</p>}
            <div className="flex gap-3">
              <button type="submit" style={{ ...btnBase, background: '#8B5CF6', color: '#fff' }}>Add Task</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: '#dfe2ee' }}>
            Your Tasks
            {tasks.length > 0 && (
              <span className="ml-2 font-mono text-[10px]" style={{ color: '#958ea0' }}>
                {tasks.filter(t => t.status === 'pending').length} pending · {tasks.filter(t => t.status === 'done').length} done
              </span>
            )}
          </p>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(139,92,246,0.1)', color: '#d0bcff', border: '1px solid rgba(139,92,246,0.3)' }}>
              + Add Task
            </button>
          )}
        </div>
        {tasks.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed rgba(73,68,84,0.5)' }}>
            <p className="text-sm" style={{ color: '#958ea0' }}>No tasks yet. Click "+ Add Task" to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task._id}
                className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                style={{ ...cardStyle, padding: '1rem', opacity: task.status === 'done' ? 0.5 : 1 }}>
                <div className="space-y-1">
                  <p className="font-medium text-sm" style={{ color: task.status === 'done' ? '#958ea0' : '#dfe2ee', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                    {task.title}
                  </p>
                  <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>{task.category || task.course} · Due: {task.dueDate}</p>
                  <span className="inline-flex items-center font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                    style={priorityStyle[task.priority]}>{task.priority}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleToggle(task._id)}
                    style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                    {task.status === 'pending' ? '✓ Done' : '↺ Pending'}
                  </button>
                  <button onClick={() => handleDelete(task._id)}
                    style={{ ...btnBase, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Schedule */}
      <div style={cardStyle}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#dfe2ee' }}>AI Study Schedule</p>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>Time-aware plan starting from your current IST time.</p>
          </div>
          {savedPlans.length > 0 && (
            <button onClick={() => setShowHistory(v => !v)}
              style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
              {showHistory ? '▲ Hide History' : `Saved Plans (${savedPlans.length})`}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: '#cbc3d7' }}>Plan for</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              style={{ ...inputCls.style, width: 'auto', padding: '0.375rem 0.75rem' }}>
              {[1, 2, 3, 5, 7, 10, 14, 21, 30].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <button onClick={handleGenerateSchedule} disabled={aiLoading}
            style={{ ...btnBase, background: aiLoading ? 'rgba(139,92,246,0.5)' : '#8B5CF6', color: '#fff', opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? '⟳ Generating...' : `✨ Generate ${days}-Day AI Plan`}
          </button>
        </div>

        {aiError && <p className="text-sm rounded-lg px-3 py-2 mb-4" style={{ background: 'rgba(239,68,68,0.1)', color: '#ffb4ab', border: '1px solid rgba(239,68,68,0.3)' }}>{aiError}</p>}

        {suggestion && (
          <div className="rounded-xl p-5" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>
                AI Plan — {days} Day{days > 1 ? 's' : ''} (from now)
              </p>
              <button onClick={() => setShowSaveForm(v => !v)}
                style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: '#d0bcff', border: '1px solid rgba(139,92,246,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                {planSaved ? '✅ Saved!' : showSaveForm ? '✕ Cancel' : '💾 Save Plan'}
              </button>
            </div>
            {showSaveForm && (
              <div className="mb-4 flex gap-2">
                <input type="text" placeholder="Plan title (e.g. Week 3 Sprint)" value={planTitle}
                  onChange={e => setPlanTitle(e.target.value)} {...inputCls} style={{ ...inputCls.style, flex: 1, width: 'auto' }} />
                <button onClick={handleSavePlan} disabled={savingPlan || !planTitle.trim()}
                  style={{ ...btnBase, background: '#8B5CF6', color: '#fff', opacity: (savingPlan || !planTitle.trim()) ? 0.5 : 1 }}>
                  {savingPlan ? '...' : 'Save'}
                </button>
              </div>
            )}
            <MarkdownRenderer content={suggestion} />
          </div>
        )}

        {showHistory && savedPlans.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold" style={{ color: '#dfe2ee' }}>
              Saved Plans <span className="font-mono text-[10px]" style={{ color: '#958ea0' }}>{savedPlans.length} saved</span>
            </p>
            {savedPlans.map(plan => (
              <div key={plan._id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(51,65,85,0.4)', background: 'rgba(15,23,42,0.4)' }}>
                <div className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    {editingPlan === plan._id ? (
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} {...inputCls} style={{ ...inputCls.style, width: 'auto' }} />
                    ) : (
                      <p className="text-sm font-semibold" style={{ color: '#dfe2ee' }}>{plan.title}</p>
                    )}
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>
                      {plan.days} days · {new Date(plan.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} · {plan.tasks.slice(0, 50)}{plan.tasks.length > 50 ? '...' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {editingPlan === plan._id ? (
                      <>
                        <button onClick={() => handleUpdatePlan(plan._id)} disabled={saving}
                          style={{ ...btnBase, background: '#8B5CF6', color: '#fff', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                          {saving ? '...' : '✓ Save'}
                        </button>
                        <button onClick={() => setEditingPlan(null)}
                          style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setViewingPlan(viewingPlan === plan._id ? null : plan._id)}
                          style={{ ...btnBase, background: 'rgba(139,92,246,0.1)', color: '#d0bcff', border: '1px solid rgba(139,92,246,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                          {viewingPlan === plan._id ? '▲ Close' : '▶ View'}
                        </button>
                        <button onClick={() => { setEditingPlan(plan._id); setEditContent(plan.content); setEditTitle(plan.title); setViewingPlan(null) }}
                          style={{ ...btnBase, background: 'rgba(59,130,246,0.1)', color: '#7bd0ff', border: '1px solid rgba(59,130,246,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeletePlan(plan._id)}
                          style={{ ...btnBase, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {viewingPlan === plan._id && editingPlan !== plan._id && (
                  <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(51,65,85,0.4)', background: 'rgba(15,23,42,0.3)' }}>
                    <MarkdownRenderer content={plan.content} />
                  </div>
                )}
                {editingPlan === plan._id && (
                  <div className="px-4 py-4 space-y-3" style={{ borderTop: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.05)' }}>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>Edit Plan Content (Markdown)</p>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={12}
                      className="w-full resize-y font-mono text-sm"
                      style={{ ...inputCls.style, fontFamily: 'var(--font-jetbrains), monospace' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
