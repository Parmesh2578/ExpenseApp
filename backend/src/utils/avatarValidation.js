/** Max decoded image size (bytes) for stored profile photos. */
const MAX_BYTES = 350_000

/**
 * @param {unknown} raw - from JSON body; null or '' clears the avatar
 * @returns {{ mode: 'clear' } | { mode: 'set', value: string }}
 */
export function normalizeAvatarUpdate(raw) {
  if (raw === null || raw === '') return { mode: 'clear' }
  if (typeof raw !== 'string') {
    const err = new Error('Invalid avatar payload')
    err.status = 400
    throw err
  }
  const m = raw.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/i)
  if (!m) {
    const err = new Error('Use a JPEG, PNG, or WebP image')
    err.status = 400
    throw err
  }
  const b64 = m[2].replace(/\s/g, '')
  let buf
  try {
    buf = Buffer.from(b64, 'base64')
  } catch {
    const err = new Error('Invalid image data')
    err.status = 400
    throw err
  }
  if (buf.length > MAX_BYTES) {
    const err = new Error('Image too large (max 350 KB)')
    err.status = 400
    throw err
  }
  return { mode: 'set', value: raw }
}
