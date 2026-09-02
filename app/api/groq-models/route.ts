import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function GET() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
  const models = await groq.models.list()
  return NextResponse.json(models.data.map((m: any) => m.id))
}
