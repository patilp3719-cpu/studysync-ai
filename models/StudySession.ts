import mongoose, { Schema, models, model } from 'mongoose'

export interface IStudySession {
  _id: string
  userId: string
  subject: string
  date: string
  plannedStart: string
  plannedEnd: string
  actualStart: string
  actualEnd: string
  skipped?: boolean
  // unified focus-tracking fields (formerly FocusLog)
  focusedMinutes: number
  distractedMinutes: number
  notes?: string
  source: 'manual' | 'timer-auto'
  createdAt: Date
}

const StudySessionSchema = new Schema<IStudySession>({
  userId:            { type: String, required: true },
  subject:           { type: String, required: true },
  date:              { type: String, required: true },
  plannedStart:      { type: String, default: '' },
  plannedEnd:        { type: String, default: '' },
  actualStart:       { type: String, default: '' },
  actualEnd:         { type: String, default: '' },
  skipped:           { type: Boolean, default: false },
  focusedMinutes:    { type: Number, default: 0 },
  distractedMinutes: { type: Number, default: 0 },
  notes:             { type: String, default: '' },
  source:            { type: String, enum: ['manual', 'timer-auto'], default: 'manual' },
}, { timestamps: true })

// Force model recompile on hot-reload so new fields are always present
delete (mongoose.models as any).StudySession
export const StudySession = model<IStudySession>('StudySession', StudySessionSchema)
