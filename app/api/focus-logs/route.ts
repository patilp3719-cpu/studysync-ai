import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { FocusLog } from '@/models/FocusLog'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const logs = await FocusLog.find({ userId: session.user.id }).sort({ date: -1 })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, subject, focusedMinutes, distractedMinutes, notes } = await req.json()
  if (!date || !subject || focusedMinutes === undefined || distractedMinutes === undefined) {
    return NextResponse.json({ error: 'date, subject, focusedMinutes, and distractedMinutes are required' }, { status: 400 })
  }

  await connectDB()
  const log = await FocusLog.create({
    userId: session.user.id,
    date,
    subject,
    focusedMinutes: Number(focusedMinutes),
    distractedMinutes: Number(distractedMinutes),
    notes: notes || '',
  })
  return NextResponse.json(log, { status: 201 })
}
