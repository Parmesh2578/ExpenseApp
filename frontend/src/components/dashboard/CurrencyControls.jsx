import { useFinance } from '../../context/FinanceContext'
import { CURRENCY_PRESETS, currencyPresetLabel } from '../../utils/financeHelpers'

export default function CurrencyControls() {
  const { currency, setCurrency } = useFinance()
  const inPresets = CURRENCY_PRESETS.some((p) => p.code === currency)

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="display-currency" className="text-sm font-medium text-slate-700 whitespace-nowrap">
          Show amounts in
        </label>
        <select
          id="display-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="min-h-10 min-w-[200px] max-w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
          aria-label="Currency to display all amounts in"
        >
          {!inPresets ? (
            <option value={currency}>
              {currency}
            </option>
          ) : null}
          {CURRENCY_PRESETS.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] leading-snug text-slate-500 sm:text-right">
        Dashboard, charts, and lists use{' '}
        <span className="font-semibold text-slate-700">{currencyPresetLabel(currency)}</span>.
      </p>
    </div>
  )
}
