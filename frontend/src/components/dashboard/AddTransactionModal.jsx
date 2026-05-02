import { HiOutlineXMark } from 'react-icons/hi2'
import { useFinance } from '../../context/FinanceContext'
import { currencyPresetLabel } from '../../utils/financeHelpers'
import TransactionForm from './TransactionForm'

export default function AddTransactionModal({ open, onClose, defaultType = 'expense' }) {
  const { currency } = useFinance()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tx-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="add-tx-title" className="text-lg font-semibold text-slate-900">
              {defaultType === 'income' ? 'Add income' : 'Add expense'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Saved locally. Enter the amount in {currencyPresetLabel(currency)} — same as &quot;Show amounts in&quot;
              above.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <HiOutlineXMark className="size-6" />
          </button>
        </div>
        <TransactionForm type={defaultType} onSubmitted={onClose} />
      </div>
    </div>
  )
}
