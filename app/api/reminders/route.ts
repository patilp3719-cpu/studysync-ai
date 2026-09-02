export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Reminder } from '@/models/Reminder'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const reminders = await Reminder.find({ userId: session.user.id }).sort({ remindAt: 1 })
    return NextResponse.json(reminders)
  } catch (err: any) {
    console.error('[GET /api/reminders]', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { title, description, remindAt, type } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Reminder title is required' }, { status: 400 })
    }
    if (!remindAt) {
      return NextResponse.json({ error: 'Reminder date/time is required' }, { status: 400 })
    }

    // Validate type — fall back to 'custom' if unknown value sent
    const VALID_TYPES = ['task', 'exam', 'custom', 'deadline', 'meeting']
    const resolvedType = VALID_TYPES.includes(type) ? type : 'custom'

    await connectDB()
    const reminder = await Reminder.create({
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim() || '',
      remindAt,
      type: resolvedType,
      done: false,
    })
    return NextResponse.json(reminder, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/reminders]', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
