import { useEffect, useState } from 'react'
import axios from 'axios'
import { Navigate } from 'react-router-dom'
import { API_BASE, AUTH } from '../../utils/apiPaths'
import { clearAuthTokens } from '../../services/apiClient'

/**
 * Allows dashboard when access JWT exists, or bootstraps from refresh token once.
 */
export default function RequireAuth({ children }) {
  const [state, setState] = useState({ loading: true, ok: false })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const access = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (access) {
        if (!cancelled) setState({ loading: false, ok: true })
        return
      }
      const refresh =
        localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
      if (!refresh || !API_BASE) {
        if (!cancelled) setState({ loading: false, ok: false })
        return
      }
      try {
        const { data } = await axios.post(`${API_BASE}${AUTH.refresh}`, { refreshToken: refresh })
        const store = localStorage.getItem('refreshToken') ? localStorage : sessionStorage
        store.setItem('token', data.accessToken)
        store.setItem('refreshToken', data.refreshToken)
        window.dispatchEvent(new Event('expenseapp-auth'))
        if (!cancelled) setState({ loading: false, ok: true })
      } catch {
        clearAuthTokens()
        if (!cancelled) setState({ loading: false, ok: false })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    )
  }
  if (!state.ok) return <Navigate to="/login" replace />
  return children
}
