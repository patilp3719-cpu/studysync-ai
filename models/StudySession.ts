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
  createdAt: Date
}

const StudySessionSchema = new Schema<IStudySession>({
  userId: { type: String, required: true },
  subject: { type: String, required: true },
  date: { type: String, required: true },
  plannedStart: { type: String, required: true },
  plannedEnd: { type: String, required: true },
  actualStart: { type: String, required: true },
  actualEnd: { type: String, required: true },
  skipped: { type: Boolean, default: false },
}, { timestamps: true })

// Force model recompile on hot-reload so the 'skipped' field is always present
delete (mongoose.models as any).StudySession
export const StudySession = model<IStudySession>('StudySession', StudySessionSchema)
