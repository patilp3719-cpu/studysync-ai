import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Task } from '@/models/Task'
import { generateText } from '@/lib/groq'

function getISTDateTime(): { dateStr: string; timeStr: string; dayPart: string } {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const dateStr = ist.toISOString().split('T')[0]
  const hours = ist.getHours()
  const mins = ist.getMinutes()
  const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  const dayPart = hours < 12 ? 'morning' : hours < 17 ? 'afternoon' : hours < 21 ? 'evening' : 'night'
  return { dateStr, timeStr, dayPart }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') ?? '7')
    const userTz = searchParams.get('tz') || 'Asia/Kolkata'

    await connectDB()
    const tasks = await Task.find({ userId: session.user.id, status: 'pending' }).sort({ dueDate: 1 })

    if (tasks.length === 0) {
      return NextResponse.json({
        suggestion: 'No pending tasks found. Add some tasks to get a schedule suggestion.',
      })
    }

    const { dateStr, timeStr, dayPart } = getISTDateTime()

    const taskList = tasks
      .map((t, i) => `${i + 1}. "${t.title}" — Category: ${t.category || t.course || 'General'}, Due: ${t.dueDate}, Priority: ${t.priority}`)
      .join('\n')

    const prompt = `You are an expert study planner for a software developer/student.

Current Date & Time (IST / ${userTz}): ${dateStr} ${timeStr} (${dayPart})
IMPORTANT: Start the plan from the CURRENT time today (${timeStr} ${dayPart}), not from the beginning of the day.

The student has these pending tasks:
${taskList}

Create a practical day-by-day plan for the next ${days} days, starting from NOW (${timeStr} today).
Format as a markdown table with columns:
| Day | Date | Task / Category | Time Block | Duration | Tip |

Rules:
- Day 1 starts from current time ${timeStr} (skip past hours today)
- Fill ALL ${days} days — minimum 2-3 rows per day
- Group tasks by priority (high first)
- Keep time blocks realistic (avoid midnight sessions)
- Use bold for task names **like this**
- Tips should be short and motivating`

    const suggestion = await generateText(prompt)
    return NextResponse.json({ suggestion })
  } catch (err: any) {
    console.error('AI Schedule Error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
