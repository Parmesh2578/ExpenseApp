import { useMemo, useState } from 'react'
import moment from 'moment'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { HiOutlineArrowDownTray, HiOutlinePlus } from 'react-icons/hi2'
import { useFinance } from '../../context/FinanceContext'
import AddTransactionModal from '../../components/dashboard/AddTransactionModal'
import StatCard from '../../components/dashboard/StatCard'
import {
  BOOK_CURRENCY,
  categoryColors,
  currencyPresetLabel,
  expenseByCategoryThisMonth,
  filterMonth,
  lastMonthsExpenseSeries,
  sumExpense,
  sumIncome,
} from '../../utils/financeHelpers'

function exportCsv(transactions, bookCurrencyCode, displayCurrencyCode, toDisplay) {
  const header = [
    'Date',
    'Type',
    'Category',
    'Description',
    'AmountBook',
    'BookCurrency',
    'AmountDisplay',
    'DisplayCurrency',
  ]
  const rows = transactions.map((t) => {
    const disp = toDisplay(t.amount)
    return [
      t.date,
      t.type,
      t.category,
      t.description,
      t.amount,
      bookCurrencyCode,
      disp === null ? '' : disp,
      displayCurrencyCode,
    ]
  })
  const body = [header, ...rows]
    .map((r) =>
      r
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n')
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expense-app-${moment().format('YYYY-MM-DD')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Home() {
  const {
    transactions,
    deleteTransaction,
    currency,
    displayRatesReady,
    formatMoney,
    formatMoneyFull,
    formatDisplayUnits,
    formatDisplayUnitsCompact,
    toDisplayAmount,
  } = useFinance()
  const [modal, setModal] = useState(null)

  const thisMonth = useMemo(() => filterMonth(transactions), [transactions])
  const allIncome = useMemo(() => sumIncome(transactions), [transactions])
  const allExpense = useMemo(() => sumExpense(transactions), [transactions])
  const monthIncome = useMemo(() => sumIncome(thisMonth), [thisMonth])
  const monthExpense = useMemo(() => sumExpense(thisMonth), [thisMonth])
  const balance = allIncome - allExpense
  const netMonth = monthIncome - monthExpense

  const pieData = useMemo(() => expenseByCategoryThisMonth(transactions), [transactions])
  const barData = useMemo(() => lastMonthsExpenseSeries(transactions, 6), [transactions])

  const pieDataDisplay = useMemo(() => {
    if (!displayRatesReady) return []
    return pieData.map((d) => {
      const v = toDisplayAmount(d.value)
      return { ...d, value: v ?? 0 }
    })
  }, [pieData, toDisplayAmount, displayRatesReady])

  const barDataDisplay = useMemo(() => {
    if (!displayRatesReady) return []
    return barData.map((d) => {
      const ex = toDisplayAmount(d.expense)
      const inc = toDisplayAmount(d.income)
      return {
        ...d,
        expense: ex ?? 0,
        income: inc ?? 0,
      }
    })
  }, [barData, toDisplayAmount, displayRatesReady])

  const recent = useMemo(
    () =>
      [...transactions].sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf()).slice(0, 8),
    [transactions],
  )

  const colors = categoryColors()
  const topCategory = useMemo(() => {
    if (!pieData.length) return null
    return [...pieData].sort((a, b) => b.value - a.value)[0]
  }, [pieData])

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">
            Income, spending, and trends for{' '}
            <span className="font-medium text-slate-800">{moment().format('MMMM YYYY')}</span>
            <span className="text-slate-500"> — same currency as &quot;Show amounts in&quot; above.</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModal('expense')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-500/25 transition hover:brightness-105"
          >
            <HiOutlinePlus className="size-5" />
            Add expense
          </button>
          <button
            type="button"
            onClick={() => setModal('income')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            <HiOutlinePlus className="size-5" />
            Add income
          </button>
          <button
            type="button"
            onClick={() => exportCsv(transactions, BOOK_CURRENCY, currency, toDisplayAmount)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <HiOutlineArrowDownTray className="size-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total balance" value={formatMoney(balance)} hint="All-time income minus expenses" accent="violet" />
        <StatCard title="Income (this month)" value={formatMoney(monthIncome)} hint="Recorded inflows" accent="emerald" />
        <StatCard title="Expenses (this month)" value={formatMoney(monthExpense)} hint="Recorded outflows" accent="rose" />
        <StatCard
          title="Net this month"
          value={formatMoney(netMonth)}
          hint={netMonth >= 0 ? 'You are ahead for the month' : 'Spending exceeds income this month'}
          accent="slate"
        />
      </div>

      {topCategory ? (
        <div className="rounded-2xl border border-violet-100 bg-linear-to-r from-violet-50/80 to-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Top spending category:</span>{' '}
            {topCategory.name} at {formatMoneyFull(topCategory.value)} this month.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Spending by category</h3>
          <p className="mt-0.5 text-xs text-slate-500">This month&apos;s expenses</p>
          <div className="mt-4 h-[260px] w-full">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No expenses this month yet.
              </div>
            ) : !displayRatesReady ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center text-sm text-slate-500">
                <span>Loading exchange rates for {currencyPresetLabel(currency)}…</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieDataDisplay}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {pieDataDisplay.map((_, i) => (
                      <Cell key={pieDataDisplay[i].name} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatDisplayUnits(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {pieData.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {pieData.map((d, i) => (
                <li
                  key={d.name}
                  className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-600"
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="font-medium text-slate-800">{d.name}</span>
                  <span className="tabular-nums text-slate-500">{formatMoneyFull(d.value)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-3">
          <h3 className="text-sm font-semibold text-slate-900">Cash flow trend</h3>
          <p className="mt-0.5 text-xs text-slate-500">Last 6 months — income vs expenses</p>
          <div className="mt-4 h-[280px] w-full">
            {!displayRatesReady ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center text-sm text-slate-500">
                <span>Loading exchange rates for {currencyPresetLabel(currency)}…</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barDataDisplay} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatDisplayUnitsCompact(v)}
                  />
                  <Tooltip
                    formatter={(value) => formatDisplayUnits(value)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="Expenses" fill="#875cf5" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent activity</h3>
            <p className="text-xs text-slate-500">Latest entries across income and expenses</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Note</th>
                <th className="px-5 py-3 text-right">Amount ({currency})</th>
                <th className="px-5 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((t) => (
                <tr key={t.id} className="text-slate-700 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {moment(t.date).format('MMM D, YYYY')}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        t.type === 'income'
                          ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700'
                          : 'rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-primary'
                      }
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">{t.category}</td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-slate-600">{t.description}</td>
                  <td
                    className={`px-5 py-3 text-right font-semibold tabular-nums ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '−'}
                    {formatMoneyFull(t.amount)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        void deleteTransaction(t.id).catch((err) =>
                          alert(err.response?.data?.error || err.message || 'Could not delete.'),
                        )
                      }}
                      className="text-xs font-medium text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddTransactionModal
        open={modal !== null}
        onClose={() => setModal(null)}
        defaultType={modal === 'income' ? 'income' : 'expense'}
      />
    </div>
  )
}
