import { env } from '@repo/utils'

const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!STORAGE_URL || !SUPABASE_ANON_KEY || !SUPABASE_URL) {
  throw new Error('Wrong environment variables. Check your .env file or environment configuration.')
}

const NODE_ENV = env('NODE_ENV', 'development')
const DEV = NODE_ENV === 'development'
const DEV_MODE = DEV && (process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.NEXT_PUBLIC_DEV_MODE === '1')
const PROD = NODE_ENV === 'production'
const ANALYZE = env('ANALYZE', 'false') === 'true' || env('ANALYZE', 'false') === '1'

/**
 * Application environment.
 */
export const Env = Object.freeze({
  STORAGE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  NODE_ENV,
  DEV,
  DEV_MODE,
  PROD,
  ANALYZE,
})
