import mongoose, { Schema, models, model } from 'mongoose'

export interface ITimerPoints {
  _id: string
  userId: string
  date: string        // YYYY-MM-DD IST
  points: number
  sessions: number
  totalFocusMinutes: number
  category: string
}

const TimerPointsSchema = new Schema<ITimerPoints>({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  points: { type: Number, default: 0 },
  sessions: { type: Number, default: 0 },
  totalFocusMinutes: { type: Number, default: 0 },
  category: { type: String, default: '' },
}, { timestamps: true })

TimerPointsSchema.index({ userId: 1, date: 1 }, { unique: false })

export const TimerPoints = models.TimerPoints || model<ITimerPoints>('TimerPoints', TimerPointsSchema)
