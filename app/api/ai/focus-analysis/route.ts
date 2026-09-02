import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { FocusLog } from '@/models/FocusLog'
import { generateText } from '@/lib/groq'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const logs = await FocusLog.find({ userId: session.user.id })
    .sort({ date: -1 })
    .limit(20)

  if (logs.length === 0) {
    return NextResponse.json({
      suggestion: 'No focus logs recorded yet. Log some study sessions to get AI feedback.',
    })
  }

  const subjectMap: Record<string, { focused: number; distracted: number; count: number }> = {}
  for (const log of logs) {
    if (!subjectMap[log.subject]) subjectMap[log.subject] = { focused: 0, distracted: 0, count: 0 }
    subjectMap[log.subject].focused += log.focusedMinutes
    subjectMap[log.subject].distracted += log.distractedMinutes
    subjectMap[log.subject].count++
  }

  const subjectSummary = Object.entries(subjectMap).map(([subject, data]) => {
    const total = data.focused + data.distracted
    const ratio = total > 0 ? Math.round((data.focused / total) * 100) : 0
    return `${subject}: ${ratio}% focus average over ${data.count} session(s)`
  }).join('\n')

  const overallFocused = logs.reduce((s, l) => s + l.focusedMinutes, 0)
  const overallDistracted = logs.reduce((s, l) => s + l.distractedMinutes, 0)
  const overallTotal = overallFocused + overallDistracted
  const overallRatio = overallTotal > 0 ? Math.round((overallFocused / overallTotal) * 100) : 0

  const prompt = `You are a productivity coach reviewing a student's focus vs distraction data.

Overall focus ratio across last ${logs.length} sessions: ${overallRatio}%

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
