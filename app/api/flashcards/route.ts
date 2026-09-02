import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Flashcard } from '@/models/Flashcard'
import { generateText } from '@/lib/groq'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const sets = await Flashcard.find({ userId: session.user.id }).sort({ createdAt: -1 })
  return NextResponse.json(sets)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { subject, notes } = await req.json()
  if (!subject || !notes) return NextResponse.json({ error: 'subject and notes required' }, { status: 400 })

  const prompt = `You are a study assistant. Based on the following notes for "${subject}", generate exactly 8 flashcard Q&A pairs.

Notes:
${notes}

Return ONLY a valid JSON array like this (no markdown, no explanation):
[
  {"q": "Question 1?", "a": "Answer 1"},
  {"q": "Question 2?", "a": "Answer 2"}
]`

  await connectDB()
  let cards = '[]'
  try {
    const raw = await generateText(prompt)
    // Extract JSON array from response
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) cards = match[0]
  } catch {
    cards = '[]'
  }

  const doc = await Flashcard.create({ userId: session.user.id, subject, notes, cards })
  return NextResponse.json(doc, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await connectDB()
  await Flashcard.findOneAndDelete({ _id: id, userId: session.user.id })
  return NextResponse.json({ message: 'Deleted' })
}
