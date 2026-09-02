import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { SavedPlan } from '@/models/SavedPlan'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const plans = await SavedPlan.find({ userId: session.user.id }).sort({ createdAt: -1 })
  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, days, tasks, content } = await req.json()
  if (!title || !content) return NextResponse.json({ error: 'title and content required' }, { status: 400 })
  await connectDB()
  const plan = await SavedPlan.create({ userId: session.user.id, title, days, tasks, content })
  return NextResponse.json(plan, { status: 201 })
}
