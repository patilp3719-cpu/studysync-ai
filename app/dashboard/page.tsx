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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  await connectDB()
  const userId = session.user.id

  // Data fetches
  const allTasks = await Task.find({ userId }).sort({ dueDate: 1 })
  const pendingTasks = allTasks.filter(t => t.status === 'pending')
  const doneTasks = allTasks.filter(t => t.status === 'done')
  const nextTask = pendingTasks[0] ?? null
  const lastSession = await StudySession.findOne({ userId }).sort({ date: -1 })
  const lastFocusLog = await FocusLog.findOne({ userId }).sort({ date: -1 })
  const upcomingReminders = await Reminder.find({ userId, done: false }).sort({ remindAt: 1 }).limit(3)
  const upcomingExams = await Exam.find({ userId }).sort({ examDate: 1 }).limit(3)

  // Procrastination gap
  let procrastinationGap: number | null = null
  if (lastSession) {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    procrastinationGap = toMin(lastSession.actualStart) - toMin(lastSession.plannedStart)
  }

  // Focus ratio
  let focusRatio: number | null = null
  if (lastFocusLog) {
    const total = lastFocusLog.focusedMinutes + lastFocusLog.distractedMinutes
    focusRatio = total > 0 ? Math.round((lastFocusLog.focusedMinutes / total) * 100) : 0
  }

  // Study streak — count consecutive days with at least one focus log
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

  // Serialize exams for client component
  const examsForClient = upcomingExams.map(e => ({
    subject: e.subject,
    examDate: e.examDate,
  }))

  return (
    <div className="space-y-8">

      {/* Dynamic greeting + quote + wishing + achievement cards */}
      <DashboardClient
        firstName={session.user.name?.split(' ')[0] ?? 'there'}
        upcomingExams={examsForClient}
        doneTasks={doneTasks.length}
        pendingTasks={pendingTasks.length}
        streak={streak}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Tasks */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">📋 Pending Tasks</p>
          {pendingTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">All caught up! 🎉</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-blue-600">{pendingTasks.length}</p>
              {nextTask && (
                <p className="text-sm text-gray-600 mt-1">
                  Next: <span className="font-semibold">{nextTask.title}</span>
                  <br /><span className="text-xs text-gray-400">Due {nextTask.dueDate}</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Procrastination */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">⏱ Last Session Gap</p>
          {!lastSession ? (
            <p className="text-gray-500 text-sm">No sessions logged yet.</p>
          ) : (
            <>
              <p className={`text-3xl font-bold ${procrastinationGap! > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {procrastinationGap! > 0 ? `+${procrastinationGap}m` : 'On time ✅'}
              </p>
              <p className="text-sm text-gray-500 mt-1">{lastSession.subject} · {lastSession.date}</p>
            </>
          )}
        </div>

        {/* Focus Ratio */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">🎯 Last Focus Ratio</p>
          {!lastFocusLog ? (
            <p className="text-gray-500 text-sm">No focus logs yet.</p>
          ) : (
            <>
              <p className={`text-3xl font-bold ${focusRatio! >= 70 ? 'text-green-600' : focusRatio! >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                {focusRatio}%
              </p>
              <p className="text-sm text-gray-500 mt-1">{lastFocusLog.subject} · {lastFocusLog.date}</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div className={`h-1.5 rounded-full ${focusRatio! >= 70 ? 'bg-green-500' : focusRatio! >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${focusRatio}%` }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700 flex items-center gap-2">📅 Upcoming Countdown</p>
            <Link href="/exams" className="text-xs text-blue-500 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {upcomingExams.map(exam => {
              const days = daysUntil(exam.examDate)
              return (
                <div key={exam._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <p className="text-sm font-medium text-gray-700">{exam.subject}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                    ${days <= 3 ? 'bg-red-100 text-red-700' : days <= 7 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
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
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700 flex items-center gap-2">🔔 Upcoming Reminders</p>
            <Link href="/reminders" className="text-xs text-blue-500 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {upcomingReminders.map(r => (
              <div key={r._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <p className="text-sm font-medium text-gray-700 truncate">{r.title}</p>
                <p className="text-xs text-gray-400 shrink-0 ml-2">
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
          className="group flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all duration-200">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shrink-0">🎮</div>
          <div>
            <p className="text-white font-bold text-lg">Games Zone</p>
            <p className="text-indigo-200 text-sm mt-0.5">Memory · Typing · CS Quiz · Flashcards</p>
            <p className="text-indigo-300 text-xs mt-1.5 group-hover:translate-x-1 transition-transform">Enter zone →</p>
          </div>
        </Link>
        <Link href="/devzone"
          className="group flex items-center gap-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-5 shadow-lg hover:shadow-gray-700/40 hover:scale-[1.02] transition-all duration-200 border border-gray-700">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shrink-0">💻</div>
          <div>
            <p className="text-white font-bold text-lg">Dev Zone</p>
            <p className="text-gray-400 text-sm mt-0.5">DSA · Projects · Interview · Stack</p>
            <p className="text-green-400 text-xs mt-1.5 group-hover:translate-x-1 transition-transform">Enter zone →</p>
          </div>
        </Link>
      </div>

      {/* Study Tools Quick Access */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-4">Study Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Link href="/planner" className="block bg-blue-50 border border-blue-200 rounded-2xl p-4 hover:bg-blue-100 transition">
            <p className="text-xl mb-1">📋</p>
            <p className="font-semibold text-blue-700 text-sm">Planner</p>
            <p className="text-xs text-blue-500 mt-0.5">AI study schedule</p>
          </Link>
          <Link href="/sessions" className="block bg-purple-50 border border-purple-200 rounded-2xl p-4 hover:bg-purple-100 transition">
            <p className="text-xl mb-1">⏱</p>
            <p className="font-semibold text-purple-700 text-sm">Sessions</p>
            <p className="text-xs text-purple-500 mt-0.5">Procrastination tracker</p>
          </Link>
          <Link href="/analyzer" className="block bg-green-50 border border-green-200 rounded-2xl p-4 hover:bg-green-100 transition">
            <p className="text-xl mb-1">🎯</p>
            <p className="font-semibold text-green-700 text-sm">Analyzer</p>
            <p className="text-xs text-green-500 mt-0.5">Focus vs distraction</p>
          </Link>
          <Link href="/timer" className="block bg-orange-50 border border-orange-200 rounded-2xl p-4 hover:bg-orange-100 transition">
            <p className="text-xl mb-1">🍅</p>
            <p className="font-semibold text-orange-700 text-sm">Timer</p>
            <p className="text-xs text-orange-500 mt-0.5">Pomodoro focus</p>
          </Link>
          <Link href="/exams" className="block bg-red-50 border border-red-200 rounded-2xl p-4 hover:bg-red-100 transition">
            <p className="text-xl mb-1">📅</p>
            <p className="font-semibold text-red-700 text-sm">Countdown</p>
            <p className="text-xs text-red-500 mt-0.5">Events + AI prep</p>
          </Link>
          <Link href="/reminders" className="block bg-yellow-50 border border-yellow-200 rounded-2xl p-4 hover:bg-yellow-100 transition">
            <p className="text-xl mb-1">🔔</p>
            <p className="font-semibold text-yellow-700 text-sm">Reminders</p>
            <p className="text-xs text-yellow-500 mt-0.5">Deadline alerts</p>
          </Link>
          <Link href="/flashcards" className="block bg-indigo-50 border border-indigo-200 rounded-2xl p-4 hover:bg-indigo-100 transition">
            <p className="text-xl mb-1">🃏</p>
            <p className="font-semibold text-indigo-700 text-sm">Flashcards</p>
            <p className="text-xs text-indigo-500 mt-0.5">AI quiz cards</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
