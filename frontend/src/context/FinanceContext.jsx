import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import moment from 'moment'
import {
  BOOK_CURRENCY,
  formatMoneyAmount,
  formatMoneyCompactAmount,
  formatMoneyFullAmount,
  isSupportedCurrencyCode,
} from '../utils/financeHelpers'
import {
  convertBookToDisplay,
  convertDisplayToBook,
  fetchRatesTableFromBase,
  rateToDisplay,
} from '../services/exchangeRates'
import { apiClient } from '../services/apiClient'
import { API_BASE, TRANSACTIONS } from '../utils/apiPaths'

function hasSessionToken() {
  if (typeof window === 'undefined') return false
  return !!(localStorage.getItem('token') || sessionStorage.getItem('token'))
}

function initialTxSource() {
  return API_BASE && hasSessionToken() ? 'remote' : 'local'
}

function initialTransactions() {
  if (API_BASE && hasSessionToken()) return []
  return loadInitial()
}

const STORAGE_KEY = 'expenseApp_transactions_v1'
const DISPLAY_CURRENCY_KEY = 'expenseApp_currency'

/** One cached full table per book currency (all display codes share it). */
function fxTableStorageKey(book) {
  return `expenseApp_fx_table_${String(book).toUpperCase()}`
}

const REFRESH_MS = 5 * 60 * 1000

const seedTransactions = () => {
  const t = moment()
  const day = (n) => t.clone().subtract(n, 'days').format('YYYY-MM-DD')
  return [
    { id: 'seed-1', type: 'expense', amount: 84.5, category: 'Food', description: 'Weekly groceries', date: day(2) },
    { id: 'seed-2', type: 'expense', amount: 32, category: 'Transport', description: 'Transit pass', date: day(1) },
    { id: 'seed-3', type: 'income', amount: 4200, category: 'Salary', description: 'Payroll deposit', date: day(0) },
    { id: 'seed-4', type: 'expense', amount: 129, category: 'Shopping', description: 'Winter jacket', date: day(5) },
    { id: 'seed-5', type: 'expense', amount: 210, category: 'Bills', description: 'Electricity', date: day(8) },
    { id: 'seed-6', type: 'expense', amount: 45, category: 'Entertainment', description: 'Movie night', date: day(10) },
    { id: 'seed-7', type: 'income', amount: 600, category: 'Freelance', description: 'Design project', date: day(12) },
    { id: 'seed-8', type: 'expense', amount: 28, category: 'Health', description: 'Pharmacy', date: day(14) },
    { id: 'seed-9', type: 'expense', amount: 15.5, category: 'Food', description: 'Coffee & snack', date: day(20) },
    {
      id: 'seed-10',
      type: 'expense',
      amount: 1890,
      category: 'Bills',
      description: 'Rent',
      date: t.clone().subtract(1, 'month').date(3).format('YYYY-MM-DD'),
    },
    {
      id: 'seed-11',
      type: 'income',
      amount: 4200,
      category: 'Salary',
      description: 'Payroll',
      date: t.clone().subtract(1, 'month').date(3).format('YYYY-MM-DD'),
    },
  ]
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedTransactions()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return seedTransactions()
    return parsed
  } catch {
    return seedTransactions()
  }
}

function loadDisplayCurrency() {
  try {
    const raw = localStorage.getItem(DISPLAY_CURRENCY_KEY)
    if (raw && isSupportedCurrencyCode(raw)) return raw.toUpperCase()
  } catch {
    /* ignore */
  }
  return 'USD'
}

function loadFxTable(book) {
  try {
    const raw = localStorage.getItem(fxTableStorageKey(book))
    if (!raw) return null
    const o = JSON.parse(raw)
    const b = String(book).toUpperCase()
    if (!o || o.base !== b || typeof o.rates !== 'object') return null
    return { base: b, date: o.date || '', rates: o.rates, savedAt: o.savedAt || 0 }
  } catch {
    return null
  }
}

function saveFxTable(book, payload) {
  try {
    const b = String(book).toUpperCase()
    localStorage.setItem(
      fxTableStorageKey(b),
      JSON.stringify({ ...payload, base: b, savedAt: Date.now() }),
    )
  } catch {
    /* ignore */
  }
}

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const [txSource, setTxSource] = useState(initialTxSource)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [currency, setCurrencyState] = useState(loadDisplayCurrency)
  const [rates, setRates] = useState(() => loadFxTable(BOOK_CURRENCY)?.rates ?? null)
  const mountedRef = useRef(true)
  const ratesFetchSeq = useRef(0)

  // Strict Mode runs mount → cleanup → mount again; cleanup must not leave mountedRef false forever.
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (txSource !== 'local') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions, txSource])

  const fetchTransactionsFromApi = useCallback(async () => {
    if (!API_BASE || !hasSessionToken()) {
      setTxSource('local')
      setTransactions(loadInitial())
      return
    }
    try {
      const { data } = await apiClient.get(TRANSACTIONS.list)
      if (!mountedRef.current) return
      setTransactions(Array.isArray(data.transactions) ? data.transactions : [])
      setTxSource('remote')
    } catch {
      if (!mountedRef.current) return
      setTxSource('local')
      setTransactions(loadInitial())
    }
  }, [])

  const syncTransactionsWithSession = useCallback(() => {
    if (API_BASE && hasSessionToken()) {
      fetchTransactionsFromApi()
    } else {
      setTxSource('local')
      setTransactions(loadInitial())
    }
  }, [fetchTransactionsFromApi])

  useEffect(() => {
    syncTransactionsWithSession()
    window.addEventListener('expenseapp-auth', syncTransactionsWithSession)
    window.addEventListener('expenseapp-logout', syncTransactionsWithSession)
    return () => {
      window.removeEventListener('expenseapp-auth', syncTransactionsWithSession)
      window.removeEventListener('expenseapp-logout', syncTransactionsWithSession)
    }
  }, [syncTransactionsWithSession])

  useEffect(() => {
    localStorage.setItem(DISPLAY_CURRENCY_KEY, currency)
  }, [currency])

  const refreshRates = useCallback(async () => {
    const seq = ++ratesFetchSeq.current
    try {
      if (currency === BOOK_CURRENCY) {
        if (!mountedRef.current || seq !== ratesFetchSeq.current) return
        const same = { [BOOK_CURRENCY]: 1 }
        setRates(same)
        saveFxTable(BOOK_CURRENCY, { rates: same, date: '' })
        return
      }

      const data = await fetchRatesTableFromBase(BOOK_CURRENCY)
      if (!mountedRef.current || seq !== ratesFetchSeq.current) return

      const factor = data.rates[currency]
      if (typeof factor !== 'number' || !Number.isFinite(factor) || factor <= 0) {
        throw new Error(`No rate for ${currency}`)
      }
      setRates(data.rates)
      saveFxTable(BOOK_CURRENCY, { rates: data.rates, date: data.date || '' })
    } catch {
      if (!mountedRef.current || seq !== ratesFetchSeq.current) return
      const cached = loadFxTable(BOOK_CURRENCY)
      if (cached?.rates?.[currency]) setRates(cached.rates)
    }
  }, [currency])

  useEffect(() => {
    const cached = loadFxTable(BOOK_CURRENCY)
    if (currency === BOOK_CURRENCY) {
      setRates({ [BOOK_CURRENCY]: 1 })
    } else if (cached?.rates?.[currency]) {
      setRates(cached.rates)
    } else {
      setRates(null)
    }
    refreshRates()
  }, [currency, refreshRates])

  useEffect(() => {
    const id = setInterval(() => {
      refreshRates()
    }, REFRESH_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshRates()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [refreshRates])

  const setCurrency = useCallback((code) => {
    const next = String(code ?? '')
      .trim()
      .toUpperCase()
    if (isSupportedCurrencyCode(next)) setCurrencyState(next)
  }, [])

  const toDisplay = useCallback(
    (amountBook) => convertBookToDisplay(amountBook, rates, currency, BOOK_CURRENCY),
    [rates, currency],
  )

  /** Turn a number typed in the current display currency into book ({@link BOOK_CURRENCY}) for saving. */
  const parseAmountInputToBook = useCallback(
    (displayInput) => convertDisplayToBook(displayInput, rates, currency, BOOK_CURRENCY),
    [rates, currency],
  )

  const displayRatesReady = useMemo(() => {
    if (currency === BOOK_CURRENCY) return true
    return rateToDisplay(rates, currency, BOOK_CURRENCY) != null
  }, [currency, rates])

  const formatMoney = useCallback(
    (n) => {
      const bookAmt = Number(n) || 0
      if (currency === BOOK_CURRENCY) return formatMoneyAmount(bookAmt, currency)
      if (bookAmt === 0) return formatMoneyAmount(0, currency)
      const mult = rateToDisplay(rates, currency, BOOK_CURRENCY)
      if (mult == null) return '—'
      const shown = convertBookToDisplay(bookAmt, rates, currency, BOOK_CURRENCY)
      if (shown == null) return '—'
      return formatMoneyAmount(shown, currency)
    },
    [currency, rates],
  )

  const formatMoneyFull = useCallback(
    (n) => {
      const bookAmt = Number(n) || 0
      if (currency === BOOK_CURRENCY) return formatMoneyFullAmount(bookAmt, currency)
      if (bookAmt === 0) return formatMoneyFullAmount(0, currency)
      const mult = rateToDisplay(rates, currency, BOOK_CURRENCY)
      if (mult == null) return '—'
      const shown = convertBookToDisplay(bookAmt, rates, currency, BOOK_CURRENCY)
      if (shown == null) return '—'
      return formatMoneyFullAmount(shown, currency)
    },
    [currency, rates],
  )

  const formatDisplayUnits = useCallback(
    (n) => {
      if (!displayRatesReady && currency !== BOOK_CURRENCY) return '—'
      return formatMoneyFullAmount(Number(n) || 0, currency)
    },
    [currency, displayRatesReady],
  )

  const formatDisplayUnitsCompact = useCallback(
    (n) => {
      if (!displayRatesReady && currency !== BOOK_CURRENCY) return '—'
      return formatMoneyCompactAmount(Number(n) || 0, currency)
    },
    [currency, displayRatesReady],
  )

  const addTransaction = useCallback(
    async (payload) => {
      const row = {
        type: payload.type,
        amount: Number(payload.amount),
        category: payload.category,
        description: (payload.description || '').trim() || '—',
        date: payload.date || moment().format('YYYY-MM-DD'),
      }
      if (txSource === 'remote' && API_BASE) {
        const { data } = await apiClient.post(TRANSACTIONS.create, row)
        const t = data.transaction
        setTransactions((prev) => [t, ...prev])
        return
      }
      const localRow = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
        ...row,
      }
      setTransactions((prev) => [localRow, ...prev])
    },
    [txSource],
  )

  const deleteTransaction = useCallback(
    async (id) => {
      if (txSource === 'remote' && API_BASE) {
        await apiClient.delete(TRANSACTIONS.one(id))
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    },
    [txSource],
  )

  const value = useMemo(
    () => ({
      transactions,
      addTransaction,
      deleteTransaction,
      currency,
      setCurrency,
      displayRatesReady,
      parseAmountInputToBook,
      formatMoney,
      formatMoneyFull,
      toDisplayAmount: toDisplay,
      formatDisplayUnits,
      formatDisplayUnitsCompact,
    }),
    [
      transactions,
      addTransaction,
      deleteTransaction,
      currency,
      setCurrency,
      displayRatesReady,
      parseAmountInputToBook,
      formatMoney,
      formatMoneyFull,
      toDisplay,
      formatDisplayUnits,
      formatDisplayUnitsCompact,
    ],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
