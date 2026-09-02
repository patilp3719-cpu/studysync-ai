import mongoose, { Schema, models, model } from 'mongoose'

export interface IExam {
  _id: string
  userId: string
  subject: string
  examDate: string
  notes?: string
  aiChecklist?: string
  eventType?: string
  checklistDone?: boolean
  stepsDone?: string[]   // array of step-ids that are checked off
  createdAt: Date
}

const ExamSchema = new Schema<IExam>({
  userId: { type: String, required: true },
  subject: { type: String, required: true },
  examDate: { type: String, required: true },
  notes: { type: String, default: '' },
  aiChecklist: { type: String, default: '' },
  eventType: { type: String, default: 'exam' },
  checklistDone: { type: Boolean, default: false },
  stepsDone: { type: [String], default: [] },
}, { timestamps: true })

// Force recompile on hot-reload to pick up stepsDone field
delete (mongoose.models as any).Exam
export const Exam = model<IExam>('Exam', ExamSchema)
