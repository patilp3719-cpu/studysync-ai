import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Task } from '@/models/Task'
import { StudySession } from '@/models/StudySession'
import { Exam } from '@/models/Exam'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  await connectDB()
  const userId = session.user.id

  const allTasks = await Task.find({ userId }).sort({ dueDate: 1 })
  const pendingTasks = allTasks.filter(t => t.status === 'pending')
  const doneTasks = allTasks.filter(t => t.status === 'done')
  const nextTask = pendingTasks[0] ?? null

  // Unified session data: manual sessions carry planned/actual times; timer-auto carry focus minutes
  const allSessions = await StudySession.find({ userId }).sort({ date: -1, createdAt: -1 })

  // Procrastination gap from the last *manual* session that has both planned and actual times
  const lastManualSession = allSessions.find(s => s.plannedStart && s.actualStart && !s.skipped)
  let procrastinationGap: number | null = null
  if (lastManualSession) {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    procrastinationGap = toMin(lastManualSession.actualStart) - toMin(lastManualSession.plannedStart)
  }

  // Focus ratio from the most recent session that has focus minutes
  const lastFocusSession = allSessions.find(s => (s.focusedMinutes ?? 0) > 0 || (s.distractedMinutes ?? 0) > 0)
  let focusRatio: number | null = null
  if (lastFocusSession) {
    const total = (lastFocusSession.focusedMinutes ?? 0) + (lastFocusSession.distractedMinutes ?? 0)
    focusRatio = total > 0 ? Math.round(((lastFocusSession.focusedMinutes ?? 0) / total) * 100) : 0
  }

  // Streak: consecutive days with at least one session (any type)
  let streak = 0
  if (allSessions.length > 0) {
    const uniqueDates = [...new Set(allSessions.map(s => s.date))].sort().reverse()
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    let checkDate = today
    for (const d of uniqueDates) {
      if (d === checkDate) {
        streak++
        const prev = new Date(checkDate); prev.setDate(prev.getDate() - 1)
        checkDate = prev.toISOString().split('T')[0]
      } else break
    }
  }

  const upcomingExams = await Exam.find({ userId }).sort({ examDate: 1 }).limit(3)
  const examsForClient = upcomingExams.map(e => ({ subject: e.subject, examDate: e.examDate }))

  const lastSession = allSessions[0] ?? null

  return (
    <DashboardClient
      firstName={session.user.name?.split(' ')[0] ?? 'there'}
      upcomingExams={examsForClient}
      doneTasks={doneTasks.length}
      pendingTasks={pendingTasks.length}
      streak={streak}
      procrastinationGap={procrastinationGap}
      focusRatio={focusRatio}
      lastSessionSubject={lastSession?.subject ?? null}
      lastSessionDate={lastSession?.date ?? null}
      lastFocusSubject={lastFocusSession?.subject ?? null}
      lastFocusDate={lastFocusSession?.date ?? null}
      nextTaskTitle={nextTask?.title ?? null}
      nextTaskDue={nextTask?.dueDate ?? null}
    />
  )
}
