import mongoose from 'mongoose'
import { Transaction } from '../models/Transaction.js'

export function toClientTx(doc) {
  if (!doc) return null
  const o = doc.toObject ? doc.toObject() : doc
  return {
    id: String(o._id),
    type: o.type,
    amount: o.amount,
    category: o.category,
    description: o.description || '—',
    date: o.date,
  }
}

export async function listTransactions(userId) {
  const rows = await Transaction.find({ userId }).sort({ date: -1, createdAt: -1 }).lean()
  return rows.map((o) => ({
    id: String(o._id),
    type: o.type,
    amount: o.amount,
    category: o.category,
    description: o.description || '—',
    date: o.date,
  }))
}

export async function createTransaction(userId, body) {
  const { type, amount, category, description, date } = body
  const doc = await Transaction.create({
    userId,
    type,
    amount: Number(amount),
    category: String(category || '').trim() || 'Other',
    description: String(description || '').trim() || '—',
    date: String(date || '').trim(),
  })
  return toClientTx(doc)
}

export async function deleteTransaction(userId, id) {
  if (!mongoose.isValidObjectId(id)) return null
  const doc = await Transaction.findOneAndDelete({ _id: id, userId })
  return doc ? toClientTx(doc) : null
}
