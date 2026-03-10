import 'server-only'

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from '@/db/schema'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable')
}

const sql = neon(DATABASE_URL)

export const db = drizzle({ client: sql, schema, casing: 'snake_case' })
