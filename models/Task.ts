import mongoose, { Schema, models, model } from 'mongoose'

export interface ITask {
  _id: string
  userId: string
  title: string
  category: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'done'
  createdAt: Date
}

const TaskSchema = new Schema<ITask>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  // 'course' is the old field name — kept as optional alias so existing
  // documents are not broken, but 'category' is the canonical field.
  category: { type: String, required: false, default: '' },
  course: { type: String, required: false, default: '' },
  dueDate: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'done'], default: 'pending' },
}, { timestamps: true })

// Delete cached model so schema changes are always picked up on hot-reload
delete (mongoose.models as any).Task
export const Task = model<ITask>('Task', TaskSchema)
