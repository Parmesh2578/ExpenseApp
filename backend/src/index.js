import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import { createApp } from './app.js'

const uri = process.env.MONGODB_URI
const port = parseInt(process.env.PORT || '4000', 10)

if (!uri) {
  console.error('Missing MONGODB_URI in .env')
  process.exit(1)
}

await connectDb(uri)
const { name, host } = mongoose.connection
console.log(`MongoDB connected — database "${name}" @ ${host}`)

if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 16) {
  console.error('Set JWT_ACCESS_SECRET in .env (min 16 characters).')
  process.exit(1)
}

const app = createApp()
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
  console.log(`CORS origins: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`)
})
