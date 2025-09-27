import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

import '@repo/env/load'

import { type Database } from 'supabase/types'

export const URL = process.env.SUPABASE_URL
export const DB_URL = process.env.SUPABASE_DB_URL
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
export const STORAGE_URL = process.env.STORAGE_URL

if (!URL || !DB_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables')
}

export const client = createClient<Database>(URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const pg = new Client({ connectionString: DB_URL })
await pg.connect()
export { pg }
