import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Exam } from '@/models/Exam'
import { generateText } from '@/lib/groq'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const exams = await Exam.find({ userId: session.user.id }).sort({ examDate: 1 })
  return NextResponse.json(exams)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { subject, examDate, notes, eventType } = await req.json()
  if (!subject || !examDate) return NextResponse.json({ error: 'subject and examDate required' }, { status: 400 })

  const today = new Date()
  const exam = new Date(examDate)
  const daysLeft = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Build a type-aware prompt for AI checklist
  const resolvedType = eventType || 'exam'
  const typeLabel: Record<string, string> = {
    exam: 'exam',
    interview: 'interview',
    project: 'project deadline',
    assignment: 'assignment',
    hackathon: 'hackathon',
    release: 'release / launch',
    meeting: 'meeting / review',
    other: 'event',
  }
  const label = typeLabel[resolvedType] || 'event'

  const prompt = `A student has a ${label} for "${subject}" in ${daysLeft} days (on ${examDate}).
${notes ? `Additional notes: ${notes}` : ''}

Create a concise daily preparation checklist for the ${daysLeft} days before the ${label}.
Format as a markdown numbered list. Each item = one day. Keep each item short (1 line).
Focus on progressive preparation: understanding → deep work → practice → review → final polish.`

  await connectDB()
  let aiChecklist = ''
  try {
    aiChecklist = await generateText(prompt)
  } catch {
    aiChecklist = 'AI checklist unavailable. Please generate manually.'
  }

  const doc = await Exam.create({
    userId: session.user.id,
    subject,
    examDate,
    notes: notes || '',
    aiChecklist,
    eventType: resolvedType,
  })
  return NextResponse.json(doc, { status: 201 })
}
