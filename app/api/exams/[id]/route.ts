import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Exam } from '@/models/Exam'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  await Exam.findOneAndDelete({ _id: params.id, userId: session.user.id })
  return NextResponse.json({ message: 'Deleted' })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const body = await req.json()
  const updates: Record<string, any> = {}
  if (body.aiChecklist !== undefined) updates.aiChecklist = body.aiChecklist
  if (body.checklistDone !== undefined) updates.checklistDone = body.checklistDone
  if (body.subject !== undefined) updates.subject = body.subject
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.stepsDone !== undefined) updates.stepsDone = body.stepsDone

  const exam = await Exam.findOneAndUpdate(
    { _id: params.id, userId: session.user.id },
    updates,
    { new: true }
  )
  if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(exam)
}
