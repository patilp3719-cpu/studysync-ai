export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await bcryptjs.hash(password, 10)
    await User.create({ name, email, passwordHash })

    return NextResponse.json({ message: 'User created' }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
