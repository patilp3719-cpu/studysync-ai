import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { TimerPoints } from '@/models/TimerPoints'

function getISTDate() {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  return ist.toISOString().split('T')[0]
}

// GET — fetch last 90 days of points for calendar heatmap
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const records = await TimerPoints.find({ userId: session.user.id }).sort({ date: -1 }).limit(90)
  return NextResponse.json(records)
}

// POST — log a completed uninterrupted session
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { focusMinutes, category } = await req.json()
  if (!focusMinutes) return NextResponse.json({ error: 'focusMinutes required' }, { status: 400 })

  // Points: 1 point per 5 focused minutes, bonus for longer sessions
  const pts = Math.floor(focusMinutes / 5) + (focusMinutes >= 25 ? 2 : 0) + (focusMinutes >= 50 ? 3 : 0)

  await connectDB()
  const date = getISTDate()

  // Upsert: add to existing day record or create new
  const existing = await TimerPoints.findOne({ userId: session.user.id, date, category: category || '' })
  if (existing) {
    existing.points += pts
    existing.sessions += 1
    existing.totalFocusMinutes += focusMinutes
    await existing.save()
    return NextResponse.json(existing)
  } else {
    const record = await TimerPoints.create({
      userId: session.user.id,
      date,
      points: pts,
      sessions: 1,
      totalFocusMinutes: focusMinutes,
      category: category || '',
    })
    return NextResponse.json(record, { status: 201 })
  }
}
