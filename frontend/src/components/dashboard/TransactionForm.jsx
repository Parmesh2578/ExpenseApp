import { useState } from 'react'
import moment from 'moment'
import { useFinance } from '../../context/FinanceContext'
import {
  BOOK_CURRENCY,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  currencyPresetLabel,
} from '../../utils/financeHelpers'

export default function TransactionForm({ type, onSubmitted, submitLabel }) {
  const { addTransaction, currency, displayRatesReady, parseAmountInputToBook } = useFinance()
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'))
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const n = Number(amount)
    if (!amount || Number.isNaN(n) || n <= 0) {
      setError('Enter a valid amount greater than zero.')
      return
    }
    if (currency !== BOOK_CURRENCY && !displayRatesReady) {
      setError('Exchange rates are still loading. Try again in a moment.')
      return
    }
    const bookAmount = parseAmountInputToBook(n)
    if (bookAmount == null) {
      setError('Could not convert amount — check your connection and try again.')
      return
    }
    if (!Number.isFinite(bookAmount) || bookAmount <= 0) {
      setError('That amount is too small to save after conversion. Enter a larger value.')
      return
    }
    try {
      await addTransaction({ type, amount: bookAmount, category, description, date })
      setAmount('')
      setDescription('')
      setDate(moment().format('YYYY-MM-DD'))
      setCategory(categories[0])
      onSubmitted?.()
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not save. Try again.'
      setError(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Amount ({currency === BOOK_CURRENCY ? BOOK_CURRENCY : currency})
          </label>
          {currency !== BOOK_CURRENCY ? (
            <p className="mb-1.5 text-[11px] text-slate-500">
              Type the amount in {currencyPresetLabel(currency)} — it is converted using the current rate when you
              save.
            </p>
          ) : null}
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Note</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this for?"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <button
        type="submit"
        disabled={currency !== BOOK_CURRENCY && !displayRatesReady}
        title={currency !== BOOK_CURRENCY && !displayRatesReady ? 'Waiting for exchange rates…' : undefined}
        className={
          type === 'income'
            ? 'w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50'
            : 'w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50'
        }
      >
        {submitLabel || (type === 'income' ? 'Add income' : 'Add expense')}
      </button>
    </form>
  )
}
