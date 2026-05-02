import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '—', trim: true },
    date: { type: String, required: true },
  },
  { timestamps: true },
)

transactionSchema.index({ userId: 1, date: -1 })

export const Transaction = mongoose.model('Transaction', transactionSchema)
