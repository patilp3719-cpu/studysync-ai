import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { SavedPlan } from '@/models/SavedPlan'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  await SavedPlan.findOneAndDelete({ _id: params.id, userId: session.user.id })
  return NextResponse.json({ message: 'Deleted' })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const { content, title } = await req.json()
  const plan = await SavedPlan.findOneAndUpdate(
    { _id: params.id, userId: session.user.id },
    { ...(content !== undefined && { content }), ...(title !== undefined && { title }) },
    { new: true }
  )
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(plan)
}
