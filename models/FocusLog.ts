import mongoose, { Schema, models, model } from 'mongoose'

export interface IFocusLog {
  _id: string
  userId: string
  date: string
  subject: string
  focusedMinutes: number
  distractedMinutes: number
  notes?: string
  createdAt: Date
}

const FocusLogSchema = new Schema<IFocusLog>({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  subject: { type: String, required: true },
  focusedMinutes: { type: Number, required: true },
  distractedMinutes: { type: Number, required: true },
  notes: { type: String, default: '' },
}, { timestamps: true })

export const FocusLog = models.FocusLog || model<IFocusLog>('FocusLog', FocusLogSchema)
