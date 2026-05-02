import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'

export function createApp() {
  const app = express()
  app.use(express.json())

  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173'
  const allowedOrigins = raw.split(',').map((o) => o.trim()).filter(Boolean)
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  )

  app.get('/health', (req, res) => {
    res.json({ ok: true })
  })

  app.use('/auth', authRoutes)
  app.use('/transactions', transactionRoutes)

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}
