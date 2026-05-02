import { useState } from 'react'
import axios from 'axios'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineChartPie,
  HiOutlineClipboardDocumentList,
  HiOutlineCurrencyDollar,
  HiOutlineHome,
  HiOutlineUserCircle,
  HiOutlineXMark,
} from 'react-icons/hi2'
import CurrencyControls from '../dashboard/CurrencyControls'
import { useFinance } from '../../context/FinanceContext'
import { currencyPresetLabel } from '../../utils/financeHelpers'
import { clearAuthTokens } from '../../services/apiClient'
import { API_BASE, AUTH } from '../../utils/apiPaths'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/income', label: 'Income', icon: HiOutlineCurrencyDollar },
  { to: '/expense', label: 'Expenses', icon: HiOutlineClipboardDocumentList },
  { to: '/profile', label: 'Profile', icon: HiOutlineUserCircle },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { currency } = useFinance()

  const logout = async () => {
    const refresh =
      localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
    try {
      if (API_BASE && refresh) {
        await axios.post(`${API_BASE}${AUTH.logout}`, { refreshToken: refresh })
      }
    } catch {
      /* still clear local session */
    }
    clearAuthTokens()
    window.dispatchEvent(new Event('expenseapp-logout'))
    navigate('/login', { replace: true })
  }

  const linkClass = ({ isActive }) =>
    [
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
      isActive
        ? 'bg-violet-100 text-primary'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    ].join(' ')

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-sm transition-transform lg:static lg:min-h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 lg:px-5">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HiOutlineChartPie className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">ExpenseApp</p>
              <p className="text-[11px] text-slate-500">Track your money</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <HiOutlineXMark className="size-6" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
              <Icon className="size-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <HiOutlineArrowRightOnRectangle className="size-5" />
            Log out
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:min-h-0">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <HiOutlineBars3 className="size-6" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Overview</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-semibold text-slate-900 sm:text-lg">Hey, here’s your money</h1>
                  <span
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                    title={currencyPresetLabel(currency)}
                  >
                    {currency}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <CurrencyControls />
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 sm:flex">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Saved on this device</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-white px-3 py-2.5 lg:hidden">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  isActive ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <main className="flex-1 p-4 pb-10 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
