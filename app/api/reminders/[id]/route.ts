export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Reminder } from '@/models/Reminder'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const reminder = await Reminder.findOne({ _id: params.id, userId: session.user.id })
    if (!reminder) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    reminder.done = !reminder.done
    await reminder.save()
    return NextResponse.json(reminder)
  } catch (err: any) {
    console.error('[PATCH /api/reminders/:id]', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    await Reminder.findOneAndDelete({ _id: params.id, userId: session.user.id })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: any) {
    console.error('[DELETE /api/reminders/:id]', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
