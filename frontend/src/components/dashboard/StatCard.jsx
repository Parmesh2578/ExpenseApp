const skins = {
  violet: 'bg-gradient-to-br from-violet-500/[0.08] to-fuchsia-500/[0.06] ring-violet-500/10',
  emerald: 'bg-gradient-to-br from-emerald-500/[0.1] to-teal-500/[0.05] ring-emerald-500/15',
  rose: 'bg-gradient-to-br from-rose-500/[0.09] to-orange-500/[0.05] ring-rose-500/12',
  slate: 'bg-gradient-to-br from-slate-100 to-slate-50 ring-slate-200/80',
}

export default function StatCard({ title, value, hint, accent = 'violet' }) {
  const skin = skins[accent] || skins.violet

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 shadow-sm ring-1 ring-inset ${skin}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}
