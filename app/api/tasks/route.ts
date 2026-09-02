import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Task } from '@/models/Task'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const tasks = await Task.find({ userId: session.user.id }).sort({ dueDate: 1 })
    return NextResponse.json(tasks)
  } catch (err: any) {
    console.error('[GET /api/tasks] error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
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

    const { title, category, course, dueDate, priority } = body
    // Accept both 'category' and legacy 'course' field
    const taskCategory = category || course

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }
    if (!taskCategory || !taskCategory.trim()) {
      return NextResponse.json({ error: 'Task category is required' }, { status: 400 })
    }
    if (!dueDate) {
      return NextResponse.json({ error: 'Due date is required' }, { status: 400 })
    }

    await connectDB()
    const resolvedCategory = taskCategory.trim()
    const task = await Task.create({
      userId: session.user.id,
      title: title.trim(),
      category: resolvedCategory,
      course: resolvedCategory,   // keep legacy field in sync
      dueDate,
      priority: priority || 'medium',
      status: 'pending',
    })
    return NextResponse.json(task, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/tasks] error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
