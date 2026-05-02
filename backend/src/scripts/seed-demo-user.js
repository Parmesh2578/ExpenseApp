import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDb, disconnectDb } from '../db.js'
import { createUser, findUserByEmail } from '../services/userService.js'

/**
 * Creates one test user if missing. passwordHash is a placeholder until Auth (bcrypt).
 * Run: npm run seed:user
 */
const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('Set MONGODB_URI in backend/.env')
  process.exit(1)
}

const DEMO_EMAIL = 'demo@example.com'
const PLACEHOLDER_HASH = 'replace_with_bcrypt_in_auth_milestone'

try {
  await connectDb(uri)
  console.log(`Writing to database "${mongoose.connection.name}" on "${mongoose.connection.host}"`)
  let user = await findUserByEmail(DEMO_EMAIL)
  if (!user) {
    user = await createUser({ email: DEMO_EMAIL, passwordHash: PLACEHOLDER_HASH })
    console.log('Created user:', user.email, user._id.toString())
  } else {
    console.log('User already exists:', user.email, user._id.toString())
  }
} catch (e) {
  console.error(e.message)
  process.exit(1)
} finally {
  await disconnectDb()
}
