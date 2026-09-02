import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { AnalysisPlan } from '@/models/AnalysisPlan'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const plans = await AnalysisPlan.find({ userId: session.user.id }).sort({ createdAt: -1 })
    return NextResponse.json(plans)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, content, checklistItems, source } = await req.json()
    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    await connectDB()
    const plan = await AnalysisPlan.create({
      userId: session.user.id,
      title,
      content,
      checklistItems: checklistItems || [],
      source: source || '',
    })
    return NextResponse.json(plan, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
