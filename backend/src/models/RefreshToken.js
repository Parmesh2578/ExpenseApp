import mongoose from 'mongoose'

/**
 * One row per active refresh token (per device/session).
 * We only store SHA-256(refreshToken) — never the plain token after creation response.
 * On /auth/refresh we rotate: delete this doc and issue a new refresh + new access.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
)

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema)
