import { Router } from 'express'
import { requireAccessToken } from '../middleware/requireAccessToken.js'
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
} from '../services/transactionService.js'

const router = Router()

router.use(requireAccessToken)

router.get('/', async (req, res) => {
  try {
    const transactions = await listTransactions(req.userId)
    return res.json({ transactions })
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body || {}
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'type must be income or expense' })
    }
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' })
    }
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' })
    }
    const transaction = await createTransaction(req.userId, {
      type,
      amount: n,
      category,
      description,
      date,
    })
    return res.status(201).json({ transaction })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteTransaction(req.userId, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
})

export default router
