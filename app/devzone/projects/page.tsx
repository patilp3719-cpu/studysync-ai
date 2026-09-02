'use client'

import { useState } from 'react'

type Status = 'todo' | 'inprogress' | 'done'

interface Project {
  id: string
  title: string
  description: string
  techStack: string
  status: Status
  priority: 'low' | 'medium' | 'high'
  link?: string
}

const COLS: { key: Status; label: string; icon: string; headerColor: string; bg: string; border: string; badge: string }[] = [
  {
    key: 'todo',
    label: 'To Do',
    icon: '📋',
    headerColor: 'text-gray-300',
    bg: 'bg-gray-800/40',
    border: 'border-gray-700/60',
    badge: 'bg-gray-700 text-gray-300',
  },
  {
    key: 'inprogress',
    label: 'In Progress',
    icon: '⚡',
    headerColor: 'text-yellow-300',
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/20',
    badge: 'bg-yellow-500/20 text-yellow-300',
  },
  {
    key: 'done',
    label: 'Done',
    icon: '✅',
    headerColor: 'text-green-300',
    bg: 'bg-green-500/5',
    border: 'border-green-500/20',
    badge: 'bg-green-500/20 text-green-300',
  },
]

const priorityConfig = {
  low: { label: 'Low', class: 'bg-gray-700/80 text-gray-300 border border-gray-600' },
  medium: { label: 'Medium', class: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
  high: { label: 'High', class: 'bg-red-500/20 text-red-400 border border-red-500/30' },
}

const moveButtonConfig: Record<Status, { label: string; color: string }> = {
  todo: { label: '📋 To Do', color: 'hover:bg-gray-700/60 text-gray-400 border-gray-600' },
  inprogress: { label: '⚡ In Progress', color: 'hover:bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  done: { label: '✅ Done', color: 'hover:bg-green-500/10 text-green-400 border-green-500/30' },
}

function load(): Project[] {
  if (typeof window === 'undefined') return []
  const s = localStorage.getItem('dev_projects')
  return s ? JSON.parse(s) : []
}

export default function ProjectBoard() {
  const [projects, setProjects] = useState<Project[]>(load)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [techStack, setTechStack] = useState('')
  const [status, setStatus] = useState<Status>('todo')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [link, setLink] = useState('')

  function save(updated: Project[]) {
    setProjects(updated)
    localStorage.setItem('dev_projects', JSON.stringify(updated))
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const p: Project = { id: Date.now().toString(), title, description, techStack, status, priority, link }
    save([p, ...projects])
    setTitle(''); setDescription(''); setTechStack(''); setLink('')
    setStatus('todo'); setPriority('medium'); setShowForm(false)
  }

  function move(id: string, newStatus: Status) {
    save(projects.map(p => p.id === id ? { ...p, status: newStatus } : p))
  }

  function del(id: string) { save(projects.filter(p => p.id !== id)) }

  const totalDone = projects.filter(p => p.status === 'done').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">🗂️ Project Board</h1>
          <p className="text-sm text-gray-400 mt-1">
            Kanban board for your personal dev projects.
            {projects.length > 0 && (
              <span className="ml-2 text-purple-400 font-medium">
                {totalDone}/{projects.length} completed
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
            showForm
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-purple-600 text-white hover:bg-purple-500'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ New Project'}
        </button>
      </div>

      {/* Stats bar */}
      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {COLS.map(col => {
            const count = projects.filter(p => p.status === col.key).length
            return (
              <div key={col.key} className={`${col.bg} border ${col.border} rounded-xl px-4 py-3 text-center`}>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className={`text-xs font-semibold ${col.headerColor} mt-0.5`}>{col.icon} {col.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5 shadow-xl">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">✦ New Project</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Project Name *
                </label>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder="e.g. Portfolio Website, Chat App"
                  className="w-full bg-gray-900/80 border border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/60 transition"
                />
              </div>
              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Description
                </label>
                <input
                  type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the project"
                  className="w-full bg-gray-900/80 border border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/60 transition"
                />
              </div>
              {/* Tech Stack */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Tech Stack
                </label>
                <input
                  type="text" value={techStack} onChange={e => setTechStack(e.target.value)}
                  placeholder="e.g. React, Node, MongoDB"
                  className="w-full bg-gray-900/80 border border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/60 transition"
                />
              </div>
              {/* GitHub Link */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  GitHub / Link
                </label>
                <input
                  type="text" value={link} onChange={e => setLink(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-gray-900/80 border border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/60 transition"
                />
              </div>
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Status
                </label>
                <select
                  value={status} onChange={e => setStatus(e.target.value as Status)}
                  className="w-full bg-gray-900/80 border border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/60 transition"
                >
                  <option value="todo">📋 To Do</option>
                  <option value="inprogress">⚡ In Progress</option>
                  <option value="done">✅ Done</option>
                </select>
              </div>
              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Priority
                </label>
                <select
                  value={priority} onChange={e => setPriority(e.target.value as any)}
                  className="w-full bg-gray-900/80 border border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/60 transition"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-sm font-semibold transition"
            >
              ➕ Add Project
            </button>
          </form>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && !showForm && (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">🗂️</p>
          <p className="text-gray-300 font-semibold text-base">No projects yet</p>
          <p className="text-gray-500 text-sm mt-1 mb-4">Start tracking your dev builds in a Kanban board.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
          >
            + Add First Project
          </button>
        </div>
      )}

      {/* Kanban Columns */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLS.map(col => {
            const colProjects = projects.filter(p => p.status === col.key)
            return (
              <div key={col.key} className={`rounded-2xl border ${col.border} ${col.bg} p-4 min-h-48`}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">{col.icon}</span>
                  <h2 className={`text-sm font-bold ${col.headerColor}`}>{col.label}</h2>
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {colProjects.length}
                  </span>
                </div>

                {/* Project cards */}
                <div className="space-y-3">
                  {colProjects.map(p => (
                    <div
                      key={p.id}
                      className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-3 shadow-md hover:border-gray-600/60 transition group"
                    >
                      {/* Card header: title + priority */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm text-gray-100 leading-tight">{p.title}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium ${priorityConfig[p.priority].class}`}>
                          {priorityConfig[p.priority].label}
                        </span>
                      </div>

                      {/* Description */}
                      {p.description && (
                        <p className="text-xs text-gray-400 mb-2 leading-relaxed">{p.description}</p>
                      )}

                      {/* Tech Stack chips */}
                      {p.techStack && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {p.techStack.split(',').map(t => (
                            <span
                              key={t}
                              className="text-xs bg-purple-500/15 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded font-medium"
                            >
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Link */}
                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline block mb-2 truncate transition"
                        >
                          🔗 {p.link}
                        </a>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1 flex-wrap pt-1 border-t border-gray-700/50">
                        {COLS.filter(c => c.key !== col.key).map(c => (
                          <button
                            key={c.key}
                            onClick={() => move(p.id, c.key)}
                            className={`text-xs border px-2 py-1 rounded-lg transition ${moveButtonConfig[c.key].color}`}
                          >
                            {moveButtonConfig[c.key].label}
                          </button>
                        ))}
                        <button
                          onClick={() => del(p.id)}
                          className="text-xs text-red-500 hover:text-red-400 px-2 py-1 transition ml-auto"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Empty column placeholder */}
                  {colProjects.length === 0 && (
                    <div className="border-2 border-dashed border-gray-700/50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-600">No projects here</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
