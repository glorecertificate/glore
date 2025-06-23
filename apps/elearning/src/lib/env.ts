const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!STORAGE_URL || !SUPABASE_ANON_KEY || !SUPABASE_URL) {
  throw new Error('Wrong environment variables. Check your .env file or environment configuration.')
}

const ANALYZE = process.env.ANALYZE === 'true' || process.env.ANALYZE === '1'
const DEV = process.env.NODE_ENV === 'development'
const DEV_MODE = DEV && (process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.NEXT_PUBLIC_DEV_MODE === '1')
const PROD = process.env.NODE_ENV === 'production'

/**
 * Application environment.
 */
export const Env = Object.freeze({
  STORAGE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  ANALYZE,
  DEV,
  DEV_MODE,
  PROD,
})
