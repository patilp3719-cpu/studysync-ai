import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Task } from '@/models/Task'
import { StudySession } from '@/models/StudySession'
import { FocusLog } from '@/models/FocusLog'
import { Reminder } from '@/models/Reminder'
import { Exam } from '@/models/Exam'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from '@/components/DashboardClient'

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const studyTools = [
  { href: '/planner',    label: 'Planner',    sub: 'AI study schedule',       accent: '#3b82f6' },
  { href: '/sessions',   label: 'Sessions',   sub: 'Procrastination tracker', accent: '#8B5CF6' },
  { href: '/analyzer',   label: 'Analyzer',   sub: 'Focus vs distraction',    accent: '#10B981' },
  { href: '/timer',      label: 'Timer',      sub: 'Pomodoro focus',          accent: '#F97316' },
  { href: '/exams',      label: 'Countdown',  sub: 'Events + AI prep',        accent: '#EF4444' },
  { href: '/reminders',  label: 'Reminders',  sub: 'Deadline alerts',         accent: '#F59E0B' },
  { href: '/flashcards', label: 'Flashcards', sub: 'AI quiz cards',           accent: '#06B6D4' },
]

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  await connectDB()
  const userId = session.user.id

  const allTasks = await Task.find({ userId }).sort({ dueDate: 1 })
  const pendingTasks = allTasks.filter(t => t.status === 'pending')
  const doneTasks = allTasks.filter(t => t.status === 'done')
  const nextTask = pendingTasks[0] ?? null
  const lastSession = await StudySession.findOne({ userId }).sort({ date: -1 })
  const lastFocusLog = await FocusLog.findOne({ userId }).sort({ date: -1 })
  const upcomingReminders = await Reminder.find({ userId, done: false }).sort({ remindAt: 1 }).limit(3)
  const upcomingExams = await Exam.find({ userId }).sort({ examDate: 1 }).limit(3)

  let procrastinationGap: number | null = null
  if (lastSession) {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    procrastinationGap = toMin(lastSession.actualStart) - toMin(lastSession.plannedStart)
  }

  let focusRatio: number | null = null
  if (lastFocusLog) {
    const total = lastFocusLog.focusedMinutes + lastFocusLog.distractedMinutes
    focusRatio = total > 0 ? Math.round((lastFocusLog.focusedMinutes / total) * 100) : 0
  }

  const allLogs = await FocusLog.find({ userId }).sort({ date: -1 })
  let streak = 0
  if (allLogs.length > 0) {
    const uniqueDates = [...new Set(allLogs.map(l => l.date))].sort().reverse()
    const today = new Date().toISOString().split('T')[0]
    let checkDate = today
    for (const d of uniqueDates) {
      if (d === checkDate) {
        streak++
        const prev = new Date(checkDate)
        prev.setDate(prev.getDate() - 1)
        checkDate = prev.toISOString().split('T')[0]
      } else break
    }
  }

  const examsForClient = upcomingExams.map(e => ({
    subject: e.subject,
    examDate: e.examDate,
  }))

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <DashboardClient
        firstName={session.user.name?.split(' ')[0] ?? 'there'}
        upcomingExams={examsForClient}
        doneTasks={doneTasks.length}
        pendingTasks={pendingTasks.length}
        streak={streak}
      />

      {/* Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Pending Tasks */}
        <div className="rounded-xl p-5" style={{
          background: 'rgba(19,27,46,0.7)',
          border: '1px solid rgba(51,65,85,0.4)',
        }}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: '#958ea0', letterSpacing: '0.08em' }}>Pending Tasks</p>
          {pendingTasks.length === 0 ? (
            <p className="text-sm" style={{ color: '#10B981' }}>All caught up!</p>
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums" style={{ color: '#7bd0ff' }}>{pendingTasks.length}</p>
              {nextTask && (
                <div className="mt-2">
                  <p className="text-xs font-medium truncate" style={{ color: '#cbc3d7' }}>{nextTask.title}</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: '#958ea0' }}>Due {nextTask.dueDate}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Procrastination Gap */}
        <div className="rounded-xl p-5" style={{
          background: 'rgba(19,27,46,0.7)',
          border: '1px solid rgba(51,65,85,0.4)',
        }}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: '#958ea0', letterSpacing: '0.08em' }}>Last Session Gap</p>
          {!lastSession ? (
            <p className="text-sm" style={{ color: '#958ea0' }}>No sessions logged yet.</p>
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums font-mono"
                style={{ color: procrastinationGap! > 0 ? '#EF4444' : '#10B981' }}>
                {procrastinationGap! > 0 ? `+${procrastinationGap}m` : 'On time'}
              </p>
              <p className="text-xs font-mono mt-2" style={{ color: '#958ea0' }}>
                {lastSession.subject} · {lastSession.date}
              </p>
            </>
          )}
        </div>

        {/* Focus Ratio */}
        <div className="rounded-xl p-5" style={{
          background: 'rgba(19,27,46,0.7)',
          border: '1px solid rgba(51,65,85,0.4)',
        }}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: '#958ea0', letterSpacing: '0.08em' }}>Last Focus Ratio</p>
          {!lastFocusLog ? (
            <p className="text-sm" style={{ color: '#958ea0' }}>No focus logs yet.</p>
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums font-mono"
                style={{ color: focusRatio! >= 70 ? '#10B981' : focusRatio! >= 40 ? '#F59E0B' : '#EF4444' }}>
                {focusRatio}%
              </p>
              <p className="text-xs font-mono mt-1" style={{ color: '#958ea0' }}>
                {lastFocusLog.subject} · {lastFocusLog.date}
              </p>
              <div className="w-full rounded-full h-1 mt-2" style={{ background: 'rgba(73,68,84,0.5)' }}>
                <div className="h-1 rounded-full transition-all"
                  style={{
                    width: `${focusRatio}%`,
                    background: focusRatio! >= 70 ? '#10B981' : focusRatio! >= 40 ? '#F59E0B' : '#EF4444',
                  }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div className="rounded-xl p-5" style={{
          background: 'rgba(19,27,46,0.7)',
          border: '1px solid rgba(51,65,85,0.4)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: '#dfe2ee' }}>Upcoming Countdown</p>
            <Link href="/exams" className="font-mono text-[10px] font-bold uppercase tracking-widest transition-colors"
              style={{ color: '#8B5CF6' }}>View all →</Link>
          </div>
          <div className="space-y-2">
            {upcomingExams.map(exam => {
              const days = daysUntil(exam.examDate)
              return (
                <div key={exam._id} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(73,68,84,0.3)' }}>
                  <p className="text-sm font-medium" style={{ color: '#cbc3d7' }}>{exam.subject}</p>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                    style={days <= 3
                      ? { background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }
                      : days <= 7
                      ? { background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }
                      : { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                    {days === 0 ? 'TODAY' : `${days}d left`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="rounded-xl p-5" style={{
          background: 'rgba(19,27,46,0.7)',
          border: '1px solid rgba(51,65,85,0.4)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: '#dfe2ee' }}>Upcoming Reminders</p>
            <Link href="/reminders" className="font-mono text-[10px] font-bold uppercase tracking-widest"
              style={{ color: '#8B5CF6' }}>View all →</Link>
          </div>
          <div className="space-y-2">
            {upcomingReminders.map(r => (
              <div key={r._id} className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid rgba(73,68,84,0.3)' }}>
                <p className="text-sm font-medium truncate" style={{ color: '#cbc3d7' }}>{r.title}</p>
                <p className="font-mono text-[10px] shrink-0 ml-2" style={{ color: '#958ea0' }}>
                  {new Date(r.remindAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/games"
          className="group flex items-center gap-4 rounded-xl p-5 transition-all duration-200 hover:scale-[1.02]"
          style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.35)',
          }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>🎮</div>
          <div>
            <p className="font-bold text-base" style={{ color: '#c0c1ff' }}>Games Zone</p>
            <p className="text-xs mt-0.5" style={{ color: '#958ea0' }}>Memory · Typing · CS Quiz · Flashcards</p>
            <p className="font-mono text-[10px] mt-1.5 transition-transform group-hover:translate-x-1"
              style={{ color: '#8B5CF6' }}>Enter zone →</p>
          </div>
        </Link>
        <Link href="/devzone"
          className="group flex items-center gap-4 rounded-xl p-5 transition-all duration-200 hover:scale-[1.02]"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.3)',
          }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' }}>💻</div>
          <div>
            <p className="font-bold text-base" style={{ color: '#10B981' }}>Dev Zone</p>
            <p className="text-xs mt-0.5" style={{ color: '#958ea0' }}>DSA · Projects · Interview · Stack</p>
            <p className="font-mono text-[10px] mt-1.5 transition-transform group-hover:translate-x-1"
              style={{ color: '#10B981' }}>Enter zone →</p>
          </div>
        </Link>
      </div>

      {/* Study Tools */}
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{ color: '#494454', letterSpacing: '0.1em' }}>Study Tools</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {studyTools.map(tool => (
            <Link key={tool.href} href={tool.href}
              className="block rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(19,27,46,0.7)',
                border: `1px solid rgba(51,65,85,0.4)`,
              }}>
              <p className="font-semibold text-sm mb-0.5" style={{ color: '#dfe2ee' }}>{tool.label}</p>
              <p className="font-mono text-[10px]" style={{ color: '#958ea0' }}>{tool.sub}</p>
              <div className="mt-3 h-0.5 rounded-full w-8"
                style={{ background: tool.accent, opacity: 0.6 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
