export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateText } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { summary, diffSummary, total } = await req.json()

  const prompt = `A student has solved ${total} DSA/LeetCode problems. Here's their topic breakdown:
${summary}

Difficulty spread: ${diffSummary}

Based on this data:
1. Identify which topics are under-practiced (low count)
2. Recommend the top 3 topics to focus on next and why
3. Suggest 1-2 specific problems to try for each recommended topic

Keep it concise, practical, and motivating.`

  const suggestion = await generateText(prompt)
  return NextResponse.json({ suggestion })
}
