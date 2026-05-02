import moment from 'moment'

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Other',
]

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']

/** All saved amounts are interpreted in this currency. Display can differ via FX. */
export const BOOK_CURRENCY = 'USD'

/** Preset list for the currency dropdown (any valid ISO 4217 code can still be set manually). */
export const CURRENCY_PRESETS = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CNY', label: 'CNY — Chinese Yuan' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'SAR', label: 'SAR — Saudi Riyal' },
  { code: 'NZD', label: 'NZD — NZ Dollar' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'MXN', label: 'MXN — Mexican Peso' },
  { code: 'BRL', label: 'BRL — Brazilian Real' },
]

const LOCALE_BY_CURRENCY = {
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'en-DE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  SGD: 'en-SG',
  AED: 'en-AE',
  SAR: 'ar-SA',
  NZD: 'en-NZ',
  CHF: 'de-CH',
  MXN: 'es-MX',
  BRL: 'pt-BR',
}

export function localeForCurrency(code) {
  const c = String(code || 'USD').toUpperCase()
  return LOCALE_BY_CURRENCY[c] || 'en-US'
}

/** Human label for dropdown / UI (falls back to ISO code). */
export function currencyPresetLabel(code) {
  const c = String(code || 'USD').toUpperCase()
  const row = CURRENCY_PRESETS.find((p) => p.code === c)
  return row ? row.label : c
}

export function isSupportedCurrencyCode(code) {
  const c = String(code || '').trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(c)) return false
  try {
    new Intl.NumberFormat('en', { style: 'currency', currency: c }).format(0)
    return true
  } catch {
    return false
  }
}

export function formatMoneyAmount(amount, currencyCode) {
  const code = String(currencyCode || 'USD').toUpperCase()
  const locale = localeForCurrency(code)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0)
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0)
  }
}

export function formatMoneyFullAmount(amount, currencyCode) {
  const code = String(currencyCode || 'USD').toUpperCase()
  const locale = localeForCurrency(code)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0)
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0)
  }
}

/** Compact currency for chart axes (e.g. ₹4.2K, $3.2K). Amount is already in the target currency. */
export function formatMoneyCompactAmount(amount, currencyCode) {
  const code = String(currencyCode || 'USD').toUpperCase()
  const locale = localeForCurrency(code)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(Number(amount) || 0)
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(Number(amount) || 0)
  }
}

const COLORS = ['#875cf5', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#64748b']

export function categoryColors() {
  return COLORS
}

export function monthKey(dateStr) {
  return moment(dateStr).format('YYYY-MM')
}

export function isInMonth(dateStr, ref = moment()) {
  const d = moment(dateStr)
  return d.isSame(ref, 'month') && d.isSame(ref, 'year')
}

export function sumIncome(transactions) {
  return transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
}

export function sumExpense(transactions) {
  return transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
}

export function filterMonth(transactions, ref = moment()) {
  return transactions.filter((t) => isInMonth(t.date, ref))
}

export function expenseByCategoryThisMonth(transactions, ref = moment()) {
  const monthTx = filterMonth(transactions, ref).filter((t) => t.type === 'expense')
  const map = {}
  for (const t of monthTx) {
    const c = t.category || 'Other'
    map[c] = (map[c] || 0) + Number(t.amount)
  }
  return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
}

export function lastMonthsExpenseSeries(transactions, count = 6) {
  const months = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const m = moment().subtract(i, 'months').startOf('month')
    const key = m.format('YYYY-MM')
    const label = m.format("MMM 'YY")
    months.push({ key, label, expense: 0, income: 0 })
  }
  const list = months
  for (const t of transactions) {
    const k = monthKey(t.date)
    const slot = list.find((x) => x.key === k)
    if (!slot) continue
    if (t.type === 'expense') slot.expense += Number(t.amount)
    else slot.income += Number(t.amount)
  }
  return list.map((x) => ({
    label: x.label,
    expense: Math.round(x.expense * 100) / 100,
    income: Math.round(x.income * 100) / 100,
  }))
}
