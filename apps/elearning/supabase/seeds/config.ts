import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

import { supaEnv } from 'supabase/seeds/utils'
import { type Database } from 'supabase/types'

export const URL = supaEnv('URL')
export const DB_URL = supaEnv('DB_URL')
export const SERVICE_ROLE_KEY = supaEnv('SERVICE_ROLE_KEY')
export const STORAGE_URL = supaEnv('STORAGE_URL')

if (!URL || !DB_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
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
