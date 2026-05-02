import mongoose from 'mongoose'

/**
 * Opens one connection to MongoDB. Call once when your server (or script) starts.
 * Mongoose pools connections automatically.
 */
export async function connectDb(uri) {
  if (!uri) throw new Error('MONGODB_URI is missing')
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
}

export async function disconnectDb() {
  await mongoose.disconnect()
}
