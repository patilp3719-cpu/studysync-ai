import mongoose, { Schema, models, model } from 'mongoose'

export interface IUser {
  _id: string
  name: string
  email: string
  passwordHash: string
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
)

export const User = models.User || model<IUser>('User', UserSchema)
