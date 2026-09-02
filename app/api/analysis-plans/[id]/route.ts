export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { AnalysisPlan } from '@/models/AnalysisPlan'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const body = await req.json()

    // Build update object — only include defined fields
    const update: Record<string, any> = {}
    if (body.title !== undefined) update.title = body.title
    if (body.content !== undefined) update.content = body.content
    if (body.checklistItems !== undefined) update.checklistItems = body.checklistItems

    const plan = await AnalysisPlan.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      update,
      { new: true }
    )
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    return NextResponse.json(plan)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    await AnalysisPlan.findOneAndDelete({ _id: params.id, userId: session.user.id })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
