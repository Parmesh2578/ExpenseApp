import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiOutlineEnvelope, HiOutlineEye, HiOutlineEyeSlash, HiOutlineLockClosed } from 'react-icons/hi2'
import AuthLayout from '../../components/layouts/AuthLayout'
import { apiClient, persistAuthTokens } from '../../services/apiClient'
import { API_BASE, AUTH } from '../../utils/apiPaths'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SignUp = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!API_BASE) {
      setError('Set VITE_API_BASE_URL in frontend/.env (e.g. http://localhost:4000) and restart Vite.')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await apiClient.post(AUTH.register, { email: trimmed, password })
      persistAuthTokens(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        remember,
      )
      window.dispatchEvent(new Event('expenseapp-auth'))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not create account.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="lg:w-[70%] min-h-[calc(100vh-5rem)] md:min-h-0 md:h-full flex flex-col justify-center max-w-md w-full">
        <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Create an account</h3>
        <p className="text-sm text-slate-600 mt-1 mb-8">Sign up to start tracking your expenses.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p
              className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
              role="alert"
            >
              {error}
            </p>
          )}

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <HiOutlineEnvelope
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <HiOutlineEyeSlash className="size-5" /> : <HiOutlineEye className="size-5" />}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-slate-300 text-primary focus:ring-primary/30"
            />
            Remember me on this device
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-500/25 transition hover:brightness-105 disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default SignUp
