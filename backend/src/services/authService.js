import bcrypt from 'bcrypt'
import { createUser, findUserByEmail, findUserById } from './userService.js'
import { issueTokenPair, rotateRefreshToken } from './tokenService.js'

const SALT_ROUNDS = 10

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmailPassword(email, password) {
  const e = String(email || '').trim()
  const p = String(password || '')
  if (!emailRegex.test(e)) {
    const err = new Error('Invalid email')
    err.status = 400
    throw err
  }
  if (p.length < 6) {
    const err = new Error('Password must be at least 6 characters')
    err.status = 400
    throw err
  }
  return { email: e, password: p }
}

export async function registerUser(email, password) {
  validateEmailPassword(email, password)
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  try {
    const user = await createUser({ email, passwordHash })
    const tokens = await issueTokenPair(user._id)
    return {
      user: { id: user._id.toString(), email: user.email },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
    }
  } catch (e) {
    if (e.code === 11000) {
      const err = new Error('Email already registered')
      err.status = 409
      throw err
    }
    throw e
  }
}

export async function loginUser(email, password) {
  validateEmailPassword(email, password)
  const user = await findUserByEmail(email)
  if (!user) {
    const err = new Error('Invalid email or password')
    err.status = 401
    throw err
  }
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    const err = new Error('Invalid email or password')
    err.status = 401
    throw err
  }
  const tokens = await issueTokenPair(user._id)
  return {
    user: { id: user._id.toString(), email: user.email },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    refreshExpiresAt: tokens.refreshExpiresAt,
  }
}

export async function refreshSession(plainRefresh) {
  const tokens = await rotateRefreshToken(plainRefresh)
  const user = await findUserById(tokens.userId)
  if (!user) {
    const err = new Error('User not found')
    err.status = 401
    throw err
  }
  return {
    user: { id: user._id.toString(), email: user.email },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    refreshExpiresAt: tokens.refreshExpiresAt,
  }
}
