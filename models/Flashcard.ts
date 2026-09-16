import mongoose, { Schema, models, model } from 'mongoose'

export interface IFlashcard {
  _id: string
  userId: string
  subject: string
  notes: string       // input notes
  cards: string       // JSON string of [{q, a}]
  playable: boolean   // whether this deck appears in Games Zone
  icon?: string       // emoji icon shown in deck picker
  createdAt: Date
}

const FlashcardSchema = new Schema<IFlashcard>({
  userId:   { type: String, required: true },
  subject:  { type: String, required: true },
  notes:    { type: String, required: true },
  cards:    { type: String, required: true },
  playable: { type: Boolean, default: true },
  icon:     { type: String, default: '📚' },
}, { timestamps: true })

export const Flashcard = models.Flashcard || model<IFlashcard>('Flashcard', FlashcardSchema)
