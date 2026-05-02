import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { RefreshToken } from '../models/RefreshToken.js'

function hashRefreshToken(plain) {
  return crypto.createHash('sha256').update(plain, 'utf8').digest('hex')
}

function randomRefreshPlain() {
  return crypto.randomBytes(48).toString('base64url')
}

function getAccessSecret() {
  const s = process.env.JWT_ACCESS_SECRET
  if (!s || s.length < 16) {
    throw new Error('Set JWT_ACCESS_SECRET in .env (at least 16 characters)')
  }
  return s
}

function accessExpiresIn() {
  return process.env.ACCESS_TOKEN_EXPIRES || '15m'
}

function refreshExpiresAt() {
  const days = parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10)
  const ms = (Number.isFinite(days) && days > 0 ? days : 7) * 24 * 60 * 60 * 1000
  return new Date(Date.now() + ms)
}

export function signAccessToken(userId) {
  const sub = String(userId)
  return jwt.sign({ sub, typ: 'access' }, getAccessSecret(), { expiresIn: accessExpiresIn() })
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, getAccessSecret())
  if (payload.typ !== 'access' || !payload.sub) throw new Error('Invalid access token')
  return { userId: payload.sub }
}

/**
 * Create refresh row + return plain refresh (send once to client) and access JWT.
 */
export async function issueTokenPair(userId) {
  const plainRefresh = randomRefreshPlain()
  const tokenHash = hashRefreshToken(plainRefresh)
  const expiresAt = refreshExpiresAt()
  await RefreshToken.create({ userId, tokenHash, expiresAt })
  const accessToken = signAccessToken(userId)
  return {
    accessToken,
    refreshToken: plainRefresh,
    refreshExpiresAt: expiresAt,
    userId: String(userId),
  }
}

/**
 * Validate refresh, rotate (delete old), return new pair. Throws if invalid/expired.
 */
export async function rotateRefreshToken(plainRefresh) {
  if (!plainRefresh || typeof plainRefresh !== 'string') {
    const err = new Error('Invalid refresh token')
    err.status = 401
    throw err
  }
  const tokenHash = hashRefreshToken(plainRefresh)
  const doc = await RefreshToken.findOne({ tokenHash })
  if (!doc || doc.expiresAt.getTime() < Date.now()) {
    if (doc) await RefreshToken.deleteOne({ _id: doc._id })
    const err = new Error('Invalid or expired refresh token')
    err.status = 401
    throw err
  }
  const userId = doc.userId
  await RefreshToken.deleteOne({ _id: doc._id })
  return issueTokenPair(userId)
}

/** Revoke one session (logout with body refresh) or all sessions for user. */
export async function revokeRefreshToken(plainRefresh) {
  if (!plainRefresh) return
  const tokenHash = hashRefreshToken(plainRefresh)
  await RefreshToken.deleteOne({ tokenHash })
}

export async function revokeAllRefreshTokensForUser(userId) {
  await RefreshToken.deleteMany({ userId })
}
