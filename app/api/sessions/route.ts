import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { StudySession } from '@/models/StudySession'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const sessions = await StudySession.find({ userId: session.user.id }).sort({ date: -1 })
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, date, plannedStart, plannedEnd, actualStart, actualEnd, skipped } = await req.json()
  if (!subject || !date || !plannedStart || !plannedEnd || !actualStart || !actualEnd) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  await connectDB()
  const doc = await StudySession.create({
    userId: session.user.id,
    subject,
    date,
    plannedStart,
    plannedEnd,
    actualStart,
    actualEnd,
    skipped: skipped === true,
  })
  return NextResponse.json(doc, { status: 201 })
}
