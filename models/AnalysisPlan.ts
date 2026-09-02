import mongoose, { Schema, models, model } from 'mongoose'

export interface IChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface IAnalysisPlan {
  _id: string
  userId: string
  title: string
  content: string           // full AI markdown output
  checklistItems: IChecklistItem[]  // parsed action steps user can track
  source: string            // e.g. "Focus Analysis — 5 sessions"
  createdAt: Date
  updatedAt: Date
}

const ChecklistItemSchema = new Schema<IChecklistItem>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
}, { _id: false })

const AnalysisPlanSchema = new Schema<IAnalysisPlan>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  checklistItems: { type: [ChecklistItemSchema], default: [] },
  source: { type: String, default: '' },
}, { timestamps: true })

// Force recompile on hot-reload
delete (mongoose.models as any).AnalysisPlan
export const AnalysisPlan = model<IAnalysisPlan>('AnalysisPlan', AnalysisPlanSchema)
