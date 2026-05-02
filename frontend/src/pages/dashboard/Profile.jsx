import { useEffect, useRef, useState } from 'react'
import moment from 'moment'
import {
  HiOutlineCalendarDays,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlinePhoto,
  HiOutlineTrash,
  HiOutlineUserCircle,
} from 'react-icons/hi2'
import { apiClient } from '../../services/apiClient'
import { API_BASE, AUTH } from '../../utils/apiPaths'
import { fileToJpegDataUrl } from '../../utils/imageResize'

export default function Profile() {
  const fileRef = useRef(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!API_BASE)
  const [error, setError] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMsg, setPhotoMsg] = useState('')

  const loadProfile = async () => {
    if (!API_BASE) return
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.get(AUTH.me)
      setUser(data.user)
    } catch (err) {
      setUser(null)
      setError(err.response?.data?.error || err.message || 'Could not load profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!API_BASE) {
      setLoading(false)
      return
    }
    loadProfile()
  }, [])

  const initial = user?.email?.trim()?.charAt(0)?.toUpperCase() || '?'

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !API_BASE) return
    setPhotoMsg('')
    setPhotoBusy(true)
    try {
      const dataUrl = await fileToJpegDataUrl(file, 400, 0.85)
      const { data } = await apiClient.patch(AUTH.me, { avatarDataUrl: dataUrl })
      setUser(data.user)
      setPhotoMsg('Photo updated.')
    } catch (err) {
      setPhotoMsg(err.response?.data?.error || err.message || 'Could not save photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const removePhoto = async () => {
    if (!API_BASE) return
    setPhotoMsg('')
    setPhotoBusy(true)
    try {
      const { data } = await apiClient.patch(AUTH.me, { avatarDataUrl: null })
      setUser(data.user)
      setPhotoMsg('Photo removed.')
    } catch (err) {
      setPhotoMsg(err.response?.data?.error || err.message || 'Could not remove photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h2>
        <p className="mt-1 text-sm text-slate-600">
          Your account details from ExpenseApp. Updates here stay on the server.
        </p>
      </div>

      {!API_BASE && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Set <code className="rounded bg-amber-100/80 px-1.5 py-0.5 font-mono text-xs">VITE_API_BASE_URL</code>{' '}
          in <code className="rounded bg-amber-100/80 px-1.5 py-0.5 font-mono text-xs">frontend/.env</code> and
          restart Vite to load your profile from the API.
        </div>
      )}

      {API_BASE && loading && (
        <p className="text-sm text-slate-500">Loading profile…</p>
      )}

      {API_BASE && error && !loading && (
        <p
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      {API_BASE && user && !loading && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
          <div className="border-b border-slate-100 bg-linear-to-br from-violet-50 to-white px-6 py-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                {user.avatarDataUrl ? (
                  <img
                    src={user.avatarDataUrl}
                    alt=""
                    className="size-24 rounded-2xl object-cover shadow-md shadow-violet-500/20 ring-2 ring-white"
                  />
                ) : (
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-white shadow-md shadow-violet-500/25">
                    {initial}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 sm:justify-start">
                  <HiOutlineUserCircle className="size-4 shrink-0" aria-hidden />
                  Account
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-slate-900">{user.email}</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onPickPhoto}
                  />
                  <button
                    type="button"
                    disabled={photoBusy}
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <HiOutlinePhoto className="size-4" aria-hidden />
                    {photoBusy ? 'Saving…' : 'Change photo'}
                  </button>
                  {user.avatarDataUrl && (
                    <button
                      type="button"
                      disabled={photoBusy}
                      onClick={removePhoto}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      <HiOutlineTrash className="size-4" aria-hidden />
                      Remove
                    </button>
                  )}
                </div>
                {photoMsg && (
                  <p
                    className={`mt-2 text-xs ${photoMsg.includes('Could not') ? 'text-red-600' : 'text-emerald-600'}`}
                    role="status"
                  >
                    {photoMsg}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-slate-400">
                  JPEG, PNG, or WebP. Large images are resized before upload (max ~350 KB on server).
                </p>
              </div>
            </div>
          </div>

          <ul className="divide-y divide-slate-100">
            <li className="flex gap-4 px-6 py-4">
              <HiOutlineEnvelope className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
                <p className="mt-0.5 break-all text-sm font-medium text-slate-900">{user.email}</p>
              </div>
            </li>
            <li className="flex gap-4 px-6 py-4">
              <HiOutlineIdentification className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">User ID</p>
                <p className="mt-0.5 break-all font-mono text-xs text-slate-700">{user.id}</p>
              </div>
            </li>
            {user.createdAt && (
              <li className="flex gap-4 px-6 py-4">
                <HiOutlineCalendarDays className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Member since</p>
                  <p className="mt-0.5 text-sm text-slate-900">
                    {moment(user.createdAt).format('MMMM D, YYYY')}
                  </p>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
