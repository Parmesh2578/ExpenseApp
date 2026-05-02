import { User } from '../models/User.js'

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim()
}

/** Insert a new user. Throws if email already exists (Mongo duplicate key). */
export async function createUser({ email, passwordHash }) {
  return User.create({
    email: normalizeEmail(email),
    passwordHash,
  })
}

/** Find one user by email, or null. */
export async function findUserByEmail(email) {
  return User.findOne({ email: normalizeEmail(email) })
}

/** Find by Mongo _id string or ObjectId. */
export async function findUserById(id) {
  if (!id) return null
  return User.findById(id)
}

/** Shape returned to the client (no password hash). */
export function toClientUser(user) {
  if (!user) return null
  return {
    id: user._id.toString(),
    email: user.email,
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    avatarDataUrl: user.avatarDataUrl || null,
  }
}

/**
 * @param {string} userId
 * @param {{ mode: 'clear' } | { mode: 'set', value: string }} update
 */
export async function updateUserAvatar(userId, update) {
  if (update.mode === 'clear') {
    return User.findByIdAndUpdate(userId, { $unset: { avatarDataUrl: 1 } }, { new: true })
  }
  return User.findByIdAndUpdate(userId, { avatarDataUrl: update.value }, { new: true })
}
