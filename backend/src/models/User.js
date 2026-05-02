import mongoose from 'mongoose'

/**
 * One document per person who can sign in.
 * passwordHash: never store raw passwords — milestone 2 (Auth) will set this with bcrypt.
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    /** Small data-URL image (JPEG/PNG/WebP), set via PATCH /auth/me */
    avatarDataUrl: {
      type: String,
      maxlength: 600_000,
      default: undefined,
    },
  },
  { timestamps: true },
)

export const User = mongoose.model('User', userSchema)
