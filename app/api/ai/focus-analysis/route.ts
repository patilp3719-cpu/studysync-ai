export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { StudySession } from '@/models/StudySession'
import { generateText } from '@/lib/groq'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  // Read from unified StudySession — only sessions that have focus data
  const sessions = await StudySession.find({
    userId: session.user.id,
    $or: [{ focusedMinutes: { $gt: 0 } }, { distractedMinutes: { $gt: 0 } }],
  }).sort({ date: -1 }).limit(20)

  if (sessions.length === 0) {
    return NextResponse.json({
      suggestion: 'No focus data recorded yet. Complete a Pomodoro session or log a study session to get AI feedback.',
    })
  }

  const subjectMap: Record<string, { focused: number; distracted: number; count: number }> = {}
  for (const s of sessions) {
    if (!subjectMap[s.subject]) subjectMap[s.subject] = { focused: 0, distracted: 0, count: 0 }
    subjectMap[s.subject].focused    += s.focusedMinutes    ?? 0
    subjectMap[s.subject].distracted += s.distractedMinutes ?? 0
    subjectMap[s.subject].count++
  }

  const subjectSummary = Object.entries(subjectMap).map(([subject, data]) => {
    const total = data.focused + data.distracted
    const ratio = total > 0 ? Math.round((data.focused / total) * 100) : 0
    return `${subject}: ${ratio}% focus average over ${data.count} session(s)`
  }).join('\n')

  const overallFocused    = sessions.reduce((s, r) => s + (r.focusedMinutes    ?? 0), 0)
  const overallDistracted = sessions.reduce((s, r) => s + (r.distractedMinutes ?? 0), 0)
  const overallTotal = overallFocused + overallDistracted
  const overallRatio = overallTotal > 0 ? Math.round((overallFocused / overallTotal) * 100) : 0

  const prompt = `You are a productivity coach reviewing a student's focus vs distraction data.

Overall focus ratio across last ${sessions.length} sessions: ${overallRatio}%

Per-subject breakdown:
${subjectSummary}

Based on this:
1. Assess the student's overall focus quality
2. Identify the subject(s) with the most distraction
3. Provide 3 specific habit-building recommendations to improve focus

Keep your response coaching-style, encouraging, and actionable.`

  const suggestion = await generateText(prompt)
  return NextResponse.json({ suggestion })
}
