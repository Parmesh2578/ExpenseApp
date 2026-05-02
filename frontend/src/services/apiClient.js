import axios from 'axios'
import { API_BASE, AUTH } from '../utils/apiPaths'

/**
 * Axios instance for ExpenseApp backend.
 * - Access JWT in `token` (Authorization: Bearer)
 * - Refresh token in `refreshToken` (same storage as token: localStorage or sessionStorage)
 */
export const apiClient = axios.create({
  baseURL: API_BASE || undefined,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

function tokenStorage() {
  if (localStorage.getItem('refreshToken')) return localStorage
  if (sessionStorage.getItem('refreshToken')) return sessionStorage
  if (localStorage.getItem('token')) return localStorage
  if (sessionStorage.getItem('token')) return sessionStorage
  return localStorage
}

apiClient.interceptors.request.use((config) => {
  const store = tokenStorage()
  const token = store.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status
    const cfg = err.config

    const url = cfg?.url || ''
    const isAuthPath =
      url.includes(AUTH.refresh) || url.includes('/auth/login') || url.includes('/auth/register')

    if (
      status === 401 &&
      API_BASE &&
      cfg &&
      !cfg._retry &&
      !isAuthPath
    ) {
      const store = localStorage.getItem('refreshToken')
        ? localStorage
        : sessionStorage.getItem('refreshToken')
          ? sessionStorage
          : null
      const refresh = store?.getItem('refreshToken')
      if (refresh) {
        cfg._retry = true
        try {
          const { data } = await axios.post(`${API_BASE}${AUTH.refresh}`, { refreshToken: refresh })
          store.setItem('token', data.accessToken)
          store.setItem('refreshToken', data.refreshToken)
          cfg.headers.Authorization = `Bearer ${data.accessToken}`
          return apiClient(cfg)
        } catch {
          /* clear below */
        }
      }
    }

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('refreshToken')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(err)
  },
)

/** Persist access + refresh tokens (remember me → localStorage, else session). */
export function persistAuthTokens({ accessToken, refreshToken }, remember) {
  if (remember) {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refreshToken')
  } else {
    sessionStorage.setItem('token', accessToken)
    sessionStorage.setItem('refreshToken', refreshToken)
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }
}

export function clearAuthTokens() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('refreshToken')
}
