/**
 * API route segments (no trailing slash on base — see apiClient).
 *
 * Env: set `VITE_API_BASE_URL` to your backend origin, e.g. `http://localhost:4000`
 *
 * External services (used today):
 * - Exchange rates: Frankfurter — see `src/services/exchangeRates.js` and optional `VITE_FRANKFURTER_URL`.
 */

const trimSlash = (s) => String(s || '').replace(/\/+$/, '')

/** Backend REST origin; empty string until you configure a server. */
export const API_BASE = trimSlash(import.meta.env.VITE_API_BASE_URL || '')

/** Build an absolute URL for the app backend. */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE) return p
  return `${API_BASE}${p}`
}

/** Placeholder paths — align with your real API when you add a server. */
export const AUTH = {
  login: '/auth/login',
  register: '/auth/register',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',
}

export const TRANSACTIONS = {
  list: '/transactions',
  create: '/transactions',
  one: (id) => `/transactions/${encodeURIComponent(id)}`,
}
