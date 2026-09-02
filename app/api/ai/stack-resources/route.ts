export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateText } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { stack } = await req.json()

  const prompt = `A student developer knows the following technologies:
${stack}

Based on their current tech stack:
1. Identify skill gaps and suggest 2-3 technologies they should learn next
2. For each suggestion, give 1 free learning resource (YouTube channel, doc, or website)
3. Suggest one small project idea that combines their existing stack

Keep suggestions practical for a student developer building their portfolio.`

  const suggestion = await generateText(prompt)
  return NextResponse.json({ suggestion })
}
