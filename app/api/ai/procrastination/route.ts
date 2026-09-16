export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { StudySession } from '@/models/StudySession'
import { generateText } from '@/lib/groq'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  // Only manual sessions have planned/actual start times for procrastination analysis
  const sessions = await StudySession.find({
    userId: session.user.id,
    source: 'manual',
    plannedStart: { $exists: true, $ne: '' },
    actualStart: { $exists: true, $ne: '' },
  }).sort({ date: -1 }).limit(14)

  if (sessions.length === 0) {
    return NextResponse.json({
      suggestion: 'No manually-logged sessions yet. Log sessions in the Sessions page to detect procrastination patterns.',
    })
  }

  const sessionList = sessions.map((s, i) => {
    const gap = timeToMinutes(s.actualStart) - timeToMinutes(s.plannedStart)
    return `${i + 1}. Subject: ${s.subject}, Date: ${s.date}, Planned start: ${s.plannedStart}, Actual start: ${s.actualStart}, Gap: ${gap} minutes late`
  }).join('\n')

  const prompt = `You are a study habits coach analyzing a student's procrastination patterns.

Here are the student's recent study sessions (planned vs actual start times):

${sessionList}

Based on this data:
1. Identify which subjects show the most procrastination (largest gaps)
2. Label the overall procrastination level (e.g., low, moderate, high)
3. Provide 2-3 specific, actionable tips to reduce procrastination

Keep your response concise, supportive, and practical.`

  const suggestion = await generateText(prompt)
  return NextResponse.json({ suggestion })
}
