import 'dotenv/config'

import { SeedPostgres } from '@snaplet/seed/adapter-postgres'
import { defineConfig } from '@snaplet/seed/config'
import postgres from 'postgres'

const DB_URL = process.env.SUPABASE_DB_URL

if (!DB_URL) {
  throw new Error('SUPABASE_DB_URL is not set')
}

export default defineConfig({
  adapter: () => {
    const client = postgres(DB_URL)
    return new SeedPostgres(client)
  },
  select: ['!*', 'public*', 'auth.users', 'auth.identities', 'auth.sessions'],
})
