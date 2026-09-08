import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Task } from '@/models/Task'
import { StudySession } from '@/models/StudySession'
import { FocusLog } from '@/models/FocusLog'
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
  const lastSession = await StudySession.findOne({ userId }).sort({ date: -1 })
  const lastFocusLog = await FocusLog.findOne({ userId }).sort({ date: -1 })
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
      lastFocusSubject={lastFocusLog?.subject ?? null}
      lastFocusDate={lastFocusLog?.date ?? null}
      nextTaskTitle={nextTask?.title ?? null}
      nextTaskDue={nextTask?.dueDate ?? null}
    />
  )
}
