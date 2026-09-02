import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateText } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { notStarted, inProgress, done } = await req.json()

  const prompt = `A student is preparing for software engineering interviews.

Completed topics: ${done.join(', ') || 'none'}
In progress: ${inProgress.join(', ') || 'none'}
Not started: ${notStarted.join(', ') || 'none'}

Create a prioritized study plan:
1. What to finish first (from in-progress) and why
2. The best order to tackle the not-started topics
3. 2-3 practical tips for interview preparation

Keep it structured with clear priorities and motivating.`

  const suggestion = await generateText(prompt)
  return NextResponse.json({ suggestion })
}
