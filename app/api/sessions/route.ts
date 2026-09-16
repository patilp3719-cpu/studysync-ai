export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { StudySession } from '@/models/StudySession'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const sessions = await StudySession.find({ userId: session.user.id }).sort({ date: -1, createdAt: -1 })
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    subject, date,
    plannedStart = '', plannedEnd = '',
    actualStart = '',  actualEnd = '',
    skipped = false,
    focusedMinutes = 0, distractedMinutes = 0,
    notes = '',
    source = 'manual',
  } = await req.json()

  if (!subject || !date) {
    return NextResponse.json({ error: 'subject and date are required' }, { status: 400 })
  }

  // For manual sessions, planned times are still required
  if (source === 'manual' && (!plannedStart || !plannedEnd || !actualStart || !actualEnd)) {
    return NextResponse.json({ error: 'Planned and actual times are required for manual sessions' }, { status: 400 })
  }

  await connectDB()
  const doc = await StudySession.create({
    userId: session.user.id,
    subject, date,
    plannedStart, plannedEnd,
    actualStart, actualEnd,
    skipped: skipped === true,
    focusedMinutes: Number(focusedMinutes),
    distractedMinutes: Number(distractedMinutes),
    notes,
    source,
  })
  return NextResponse.json(doc, { status: 201 })
}
