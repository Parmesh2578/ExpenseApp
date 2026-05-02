import { verifyAccessToken } from '../services/tokenService.js'

/** Requires `Authorization: Bearer <access JWT>`. Sets `req.userId`. */
export function requireAccessToken(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' })
  }
  try {
    const { userId } = verifyAccessToken(token)
    req.userId = userId
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token' })
  }
}
