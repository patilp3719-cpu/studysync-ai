import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Task } from '@/models/Task'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const task = await Task.findOne({ _id: params.id, userId: session.user.id })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  task.status = task.status === 'pending' ? 'done' : 'pending'
  await task.save()
  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const task = await Task.findOneAndDelete({ _id: params.id, userId: session.user.id })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  return NextResponse.json({ message: 'Task deleted' })
}
