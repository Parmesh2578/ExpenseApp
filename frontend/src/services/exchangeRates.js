/**
 * FX rates: primary ExchangeRate-API (open.er-api.com, no key), fallback Frankfurter (ECB).
 * @see https://www.exchangerate-api.com/docs/free
 * @see https://www.frankfurter.app/docs/
 */

const DEFAULT_FRANKFURTER = 'https://api.frankfurter.app'
const DEFAULT_OPEN_ER_ROOT = 'https://open.er-api.com/v6/latest'

export function frankfurterBaseUrl() {
  return (import.meta.env.VITE_FRANKFURTER_URL || DEFAULT_FRANKFURTER).replace(/\/$/, '')
}

function openErLatestRoot() {
  return (import.meta.env.VITE_OPEN_ER_API_URL || DEFAULT_OPEN_ER_ROOT).replace(/\/$/, '')
}

/**
 * @param {number} amount - amount in `from` currency
 * @param {string} from - ISO 4217 source currency (your “stored / book” currency)
 * @param {string} to - ISO 4217 target currency (your “show / display” currency)
 * @returns {Promise<{ amount: number, base: string, date: string, rates: Record<string, number> }>}
 *          `rates[to]` is the converted value in `to` (same shape as Frankfurter JSON).
 */
export async function fetchLatestConversion(amount, from, to) {
  const fromC = String(from || 'USD').toUpperCase()
  const toC = String(to || 'USD').toUpperCase()
  const a = Number(amount)
  if (fromC === toC) {
    return {
      amount: a,
      base: fromC,
      date: '',
      rates: { [toC]: Number.isFinite(a) ? a : 0 },
    }
  }
  const u = new URL(`${frankfurterBaseUrl()}/latest`)
  u.searchParams.set('amount', String(Number.isFinite(a) ? a : 0))
  u.searchParams.set('from', fromC)
  u.searchParams.set('to', toC)

  const res = await fetch(u.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  const data = await res.json()
  if (!data || typeof data.rates !== 'object') throw new Error('Invalid conversion response')
  const converted = data.rates[toC]
  if (typeof converted !== 'number' || !Number.isFinite(converted)) {
    throw new Error(`No rate for ${toC}`)
  }
  return {
    amount: typeof data.amount === 'number' ? data.amount : a,
    base: data.base || fromC,
    date: data.date || '',
    rates: { [toC]: converted },
  }
}

/** One API call: units of `to` you get for **1** unit of `from` (uses `amount=1`). */
export async function fetchUnitConversionRate(from, to) {
  return fetchLatestConversion(1, from, to)
}

function normalizeRatesTable(ratesObj) {
  const normalized = {}
  for (const [k, v] of Object.entries(ratesObj || {})) {
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(n) && n > 0) normalized[String(k).toUpperCase()] = n
  }
  return normalized
}

/** Full table from open.er-api.com: `GET /v6/latest/{BASE}` → `rates` = units per 1 BASE. */
export async function fetchOpenErRatesTableFromBase(baseCurrency) {
  const base = String(baseCurrency || 'USD').toUpperCase()
  const u = `${openErLatestRoot()}/${encodeURIComponent(base)}`
  const res = await fetch(u)
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  const data = await res.json()
  if (!data || data.result !== 'success' || typeof data.rates !== 'object') {
    throw new Error('Invalid open.er rates response')
  }
  const normalized = normalizeRatesTable(data.rates)
  const date = data.time_last_update_utc || data.time_next_update_utc || ''
  return {
    base: String(data.base_code || base).toUpperCase(),
    date,
    rates: normalized,
  }
}

async function fetchFrankfurterRatesTableFromBase(baseCurrency) {
  const base = String(baseCurrency || 'USD').toUpperCase()
  const u = new URL(`${frankfurterBaseUrl()}/latest`)
  u.searchParams.set('from', base)
  const res = await fetch(u.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  const data = await res.json()
  if (!data || typeof data.rates !== 'object') throw new Error('Invalid rates response')
  return {
    base: String(data.base || base).toUpperCase(),
    date: data.date || '',
    rates: normalizeRatesTable(data.rates),
  }
}

/**
 * Full rate table: units of each currency per 1 unit of `base`.
 * Tries ExchangeRate-API (open.er) first, then Frankfurter — keeps one object in app state for any display currency.
 */
export async function fetchRatesTableFromBase(baseCurrency) {
  try {
    return await fetchOpenErRatesTableFromBase(baseCurrency)
  } catch {
    return fetchFrankfurterRatesTableFromBase(baseCurrency)
  }
}

/** How many `display` units per one `book` unit (matches cached `rates` shape from unit fetch). */
export function rateToDisplay(rates, displayCurrency, bookCurrency) {
  const book = String(bookCurrency || 'USD').toUpperCase()
  const display = String(displayCurrency || 'USD').toUpperCase()
  if (display === book) return 1
  if (!rates || typeof rates !== 'object') return null
  const r = rates[display]
  if (typeof r !== 'number' || !Number.isFinite(r) || r <= 0) return null
  return r
}

/**
 * @returns {number | null} Converted amount, or `null` if rates are missing for this display currency.
 */
export function convertBookToDisplay(amountBook, rates, displayCurrency, bookCurrency) {
  const n = Number(amountBook) || 0
  const book = String(bookCurrency || 'USD').toUpperCase()
  const display = String(displayCurrency || 'USD').toUpperCase()
  if (display === book) return n
  if (n === 0) return 0
  const mult = rateToDisplay(rates, displayCurrency, bookCurrency)
  if (mult == null) return null
  return Number((n * mult).toFixed(2))
}

/**
 * Inverse of convertBookToDisplay: user types amount in `display`, we return book units for storage.
 * @returns {number | null}
 */
export function convertDisplayToBook(amountDisplay, rates, displayCurrency, bookCurrency) {
  const n = Number(amountDisplay) || 0
  const book = String(bookCurrency || 'USD').toUpperCase()
  const display = String(displayCurrency || 'USD').toUpperCase()
  if (display === book) return n
  if (n === 0) return 0
  const mult = rateToDisplay(rates, display, book)
  if (mult == null || mult <= 0) return null
  return Number((n / mult).toFixed(2))
}
