import { useMemo } from 'react'
import moment from 'moment'
import { useFinance } from '../../context/FinanceContext'
import TransactionForm from '../../components/dashboard/TransactionForm'
import { currencyPresetLabel, filterMonth, sumIncome } from '../../utils/financeHelpers'

export default function Income() {
  const { transactions, deleteTransaction, formatMoneyFull, currency } = useFinance()
  const monthRows = useMemo(
    () =>
      filterMonth(transactions)
        .filter((t) => t.type === 'income')
        .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf()),
    [transactions],
  )
  const monthTotal = useMemo(() => sumIncome(filterMonth(transactions)), [transactions])

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Income</h2>
        <p className="mt-1 text-sm text-slate-600">
          Record money in. This month:{' '}
          <span className="font-semibold text-emerald-600">{formatMoneyFull(monthTotal)}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">Amounts shown in {currencyPresetLabel(currency)}.</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Add income</h3>
        <p className="mt-0.5 text-xs text-slate-500">Salary, freelance, refunds, and more.</p>
        <div className="mt-5 max-w-lg">
          <TransactionForm type="income" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-900">This month&apos;s income</h3>
          {monthRows.length > 0 ? (
            <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Entry</span>
              <div className="flex items-center gap-4">
                <span className="min-w-22 text-right tabular-nums">Amount ({currency})</span>
                <span className="w-14 shrink-0 text-right">Action</span>
              </div>
            </div>
          ) : null}
        </div>
        <ul className="divide-y divide-slate-100">
          {monthRows.length === 0 ? (
            <li className="px-6 py-10 text-center text-sm text-slate-500">No income entries this month yet.</li>
          ) : (
            monthRows.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="font-medium text-slate-900">{t.description}</p>
                  <p className="text-xs text-slate-500">
                    {t.category} · {moment(t.date).format('MMM D, YYYY')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold tabular-nums text-emerald-600">
                    +{formatMoneyFull(t.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void deleteTransaction(t.id).catch((err) =>
                        alert(err.response?.data?.error || err.message || 'Could not delete.'),
                      )
                    }}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
