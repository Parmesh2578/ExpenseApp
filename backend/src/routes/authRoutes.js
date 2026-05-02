import { Router } from 'express'
import { requireAccessToken } from '../middleware/requireAccessToken.js'
import { loginUser, refreshSession, registerUser } from '../services/authService.js'
import { findUserById, toClientUser, updateUserAvatar } from '../services/userService.js'
import { normalizeAvatarUpdate } from '../utils/avatarValidation.js'
import { revokeRefreshToken } from '../services/tokenService.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const data = await registerUser(email, password)
    return res.status(201).json(data)
  } catch (e) {
    const status = e.status || 500
    return res.status(status).json({ error: e.message || 'Server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const data = await loginUser(email, password)
    return res.json(data)
  } catch (e) {
    const status = e.status || 500
    return res.status(status).json({ error: e.message || 'Server error' })
  }
})

/** Exchange refresh token for a new access + refresh pair (rotation). */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken: plain } = req.body || {}
    const data = await refreshSession(plain)
    return res.json(data)
  } catch (e) {
    const status = e.status || 401
    return res.status(status).json({ error: e.message || 'Unauthorized' })
  }
})

/** Revoke the given refresh token (logout this device). */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken: plain } = req.body || {}
    await revokeRefreshToken(plain)
    return res.status(204).send()
  } catch {
    return res.status(204).send()
  }
})

router.get('/me', requireAccessToken, async (req, res) => {
  try {
    const user = await findUserById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json({ user: toClientUser(user) })
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
})

/** Update profile fields (today: avatar only). Body: { avatarDataUrl: string | null } */
router.patch('/me', requireAccessToken, async (req, res) => {
  try {
    if (!req.body || !('avatarDataUrl' in req.body)) {
      return res.status(400).json({ error: 'Send avatarDataUrl (or null to remove)' })
    }
    let normalized
    try {
      normalized = normalizeAvatarUpdate(req.body.avatarDataUrl)
    } catch (e) {
      const status = e.status || 400
      return res.status(status).json({ error: e.message })
    }
    const user = await updateUserAvatar(req.userId, normalized)
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json({ user: toClientUser(user) })
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
})

export default router
