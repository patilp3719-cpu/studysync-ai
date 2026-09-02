import mongoose, { Schema, models, model } from 'mongoose'

export interface ISavedPlan {
  _id: string
  userId: string
  title: string
  days: number
  tasks: string       // snapshot of task titles used
  content: string     // full AI markdown output
  createdAt: Date
}

const SavedPlanSchema = new Schema<ISavedPlan>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  days: { type: Number, required: true },
  tasks: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true })

export const SavedPlan = models.SavedPlan || model<ISavedPlan>('SavedPlan', SavedPlanSchema)
