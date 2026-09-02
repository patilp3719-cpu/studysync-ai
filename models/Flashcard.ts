import mongoose, { Schema, models, model } from 'mongoose'

export interface IFlashcard {
  _id: string
  userId: string
  subject: string
  notes: string       // input notes
  cards: string       // JSON string of [{q, a}]
  createdAt: Date
}

const FlashcardSchema = new Schema<IFlashcard>({
  userId: { type: String, required: true },
  subject: { type: String, required: true },
  notes: { type: String, required: true },
  cards: { type: String, required: true },
}, { timestamps: true })

export const Flashcard = models.Flashcard || model<IFlashcard>('Flashcard', FlashcardSchema)
