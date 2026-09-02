import mongoose, { Schema, models, model } from 'mongoose'

export interface IReminder {
  _id: string
  userId: string
  title: string
  description?: string
  remindAt: string    // ISO datetime string
  type: 'task' | 'exam' | 'custom' | 'deadline' | 'meeting'
  done: boolean
  createdAt: Date
}

const ReminderSchema = new Schema<IReminder>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  remindAt: { type: String, required: true },
  type: {
    type: String,
    enum: ['task', 'exam', 'custom', 'deadline', 'meeting'],
    default: 'custom',
  },
  done: { type: Boolean, default: false },
}, { timestamps: true })

// Force recompile on hot-reload so enum changes are always picked up
delete (mongoose.models as any).Reminder
export const Reminder = model<IReminder>('Reminder', ReminderSchema)
