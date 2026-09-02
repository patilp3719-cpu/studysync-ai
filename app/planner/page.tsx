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

interface Task {
  _id: string
  title: string
  category: string
  course?: string   // legacy support
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'done'
}

interface SavedPlan {
  _id: string
  title: string
  days: number
  tasks: string
  content: string
  createdAt: string
}

const priorityStyles: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(TASK_CATEGORIES[0])
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)   // hidden by default

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

  // Edit mode for saved plans
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

  useEffect(() => {
    loadTasks()
    loadSavedPlans()
  }, [])

  // Get user's IST offset for AI
  function getTimezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'Asia/Kolkata' }
  }

  async function handleSavePlan() {
    if (!planTitle.trim()) return
    setSavingPlan(true)
    const taskSnapshot = tasks.filter(t => t.status === 'pending').map(t => t.title).join(', ')
    const res = await fetch('/api/saved-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: planTitle, days, tasks: taskSnapshot, content: suggestion }),
    })
    setSavingPlan(false)
    if (res.ok) {
      setPlanSaved(true)
      setShowSaveForm(false)
      setPlanTitle('')
      loadSavedPlans()
      setTimeout(() => setPlanSaved(false), 3000)
    }
  }

  async function handleUpdatePlan(id: string) {
    setSaving(true)
    const res = await fetch(`/api/saved-plans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent, title: editTitle }),
    })
    setSaving(false)
    if (res.ok) {
      setEditingPlan(null)
      loadSavedPlans()
    }
  }

  async function handleDeletePlan(id: string) {
    await fetch(`/api/saved-plans/${id}`, { method: 'DELETE' })
    if (viewingPlan === id) setViewingPlan(null)
    if (editingPlan === id) setEditingPlan(null)
    loadSavedPlans()
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, dueDate, priority }),
      })
      if (res.ok) {
        setTitle('')
        setCategory(TASK_CATEGORIES[0])
        setDueDate('')
        setPriority('medium')
        setShowForm(false)
        loadTasks()
      } else {
        let errorMsg = 'Failed to add task'
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch {
          // response body was empty or not JSON — use status text
          errorMsg = res.statusText || `Server error (${res.status})`
        }
        setFormError(errorMsg)
      }
    } catch (err) {
      setFormError('Network error — please check your connection and try again.')
    }
  }

  async function handleToggle(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'PATCH' })
    loadTasks()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    loadTasks()
  }

  async function handleGenerateSchedule() {
    setAiLoading(true)
    setAiError('')
    setSuggestion('')
    try {
      const tz = getTimezone()
      const res = await fetch(`/api/ai/schedule?days=${days}&tz=${encodeURIComponent(tz)}`)
      const data = await res.json()
      if (res.ok) setSuggestion(data.suggestion)
      else setAiError(data.error || 'Failed to generate schedule')
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
          <h1 className="text-2xl font-bold text-gray-800">📋 AI Task Planner</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your dev tasks and generate an AI-powered time-aware schedule.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
            showForm
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showForm ? '✕ Hide Form' : '+ Add Task'}
        </button>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">New Task</h2>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Task Title *</label>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder="e.g. Solve 10 LeetCode medium problems"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Task Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Due Date *</label>
                <input
                  type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
            </div>
            {formError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
            <div className="flex gap-3">
              <button type="submit"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                Add Task
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">
            Your Tasks
            {tasks.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {tasks.filter(t => t.status === 'pending').length} pending · {tasks.filter(t => t.status === 'done').length} done
              </span>
            )}
          </h2>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
              + Add Task
            </button>
          )}
        </div>
        {tasks.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-2xl">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-gray-500 text-sm">No tasks yet.</p>
            <p className="text-gray-400 text-xs mt-1">Click "+ Add Task" above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task._id}
                className={`bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${task.status === 'done' ? 'opacity-60' : ''}`}>
                <div className="space-y-1">
                  <p className={`font-medium text-gray-800 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500">{task.category || task.course} · Due: {task.dueDate}</p>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleToggle(task._id)}
                    className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                    {task.status === 'pending' ? '✓ Done' : '↺ Pending'}
                  </button>
                  <button onClick={() => handleDelete(task._id)}
                    className="text-xs border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 transition">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Schedule Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-700">✨ AI Study Schedule</h2>
            <p className="text-xs text-gray-400 mt-0.5">Time-aware plan starting from your current IST time.</p>
          </div>
          {savedPlans.length > 0 && (
            <button onClick={() => setShowHistory(v => !v)}
              className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition shrink-0">
              {showHistory ? '▲ Hide History' : `📂 Saved Plans (${savedPlans.length})`}
            </button>
          )}
        </div>

        {/* Days selector + generate button */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Plan for</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
              {[1, 2, 3, 5, 7, 10, 14, 21, 30].map(d => (
                <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerateSchedule} disabled={aiLoading}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition">
            {aiLoading ? `⟳ Generating...` : `✨ Generate ${days}-Day AI Plan`}
          </button>
        </div>

        {aiError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{aiError}</p>}

        {/* Current generated plan */}
        {suggestion && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-purple-600">📅</span>
                <p className="text-xs font-bold text-purple-700 uppercase tracking-widest">
                  AI Plan — {days} Day{days > 1 ? 's' : ''} (from now)
                </p>
              </div>
              <button onClick={() => setShowSaveForm(v => !v)}
                className="text-xs bg-white border border-purple-300 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition shrink-0">
                {planSaved ? '✅ Saved!' : showSaveForm ? '✕ Cancel' : '💾 Save Plan'}
              </button>
            </div>
            {showSaveForm && (
              <div className="mb-4 flex gap-2">
                <input type="text" placeholder="Plan title (e.g. Week 3 Sprint)" value={planTitle}
                  onChange={e => setPlanTitle(e.target.value)}
                  className="flex-1 border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
                <button onClick={handleSavePlan} disabled={savingPlan || !planTitle.trim()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition">
                  {savingPlan ? '...' : 'Save'}
                </button>
              </div>
            )}
            <MarkdownRenderer content={suggestion} />
          </div>
        )}

        {/* Plan History */}
        {showHistory && savedPlans.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-bold text-gray-700">📂 Saved Plans <span className="font-normal text-gray-400">{savedPlans.length} saved</span></h3>
            {savedPlans.map(plan => (
              <div key={plan._id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    {editingPlan === plan._id ? (
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        className="border border-purple-300 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    ) : (
                      <p className="font-semibold text-sm text-gray-800">{plan.title}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {plan.days} days · {new Date(plan.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} · {plan.tasks.slice(0, 50)}{plan.tasks.length > 50 ? '...' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {editingPlan === plan._id ? (
                      <>
                        <button onClick={() => handleUpdatePlan(plan._id)} disabled={saving}
                          className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition">
                          {saving ? '...' : '✓ Save'}
                        </button>
                        <button onClick={() => setEditingPlan(null)}
                          className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setViewingPlan(viewingPlan === plan._id ? null : plan._id)}
                          className="text-xs border border-purple-200 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition">
                          {viewingPlan === plan._id ? '▲ Close' : '▶ View'}
                        </button>
                        <button onClick={() => { setEditingPlan(plan._id); setEditContent(plan.content); setEditTitle(plan.title); setViewingPlan(null) }}
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

                {/* View mode */}
                {viewingPlan === plan._id && editingPlan !== plan._id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                    <MarkdownRenderer content={plan.content} />
                  </div>
                )}

                {/* Edit mode */}
                {editingPlan === plan._id && (
                  <div className="border-t border-purple-100 bg-purple-50 px-4 py-4 space-y-3">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Edit Plan Content (Markdown)</p>
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={12}
                      className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white resize-y"
                    />
                    <p className="text-xs text-gray-400">You can edit the markdown table or add your own notes.</p>
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
