const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!STORAGE_URL || !SUPABASE_ANON_KEY || !SUPABASE_URL) {
  throw new Error('Wrong environment variables. Check your .env file or environment configuration.')
}

/**
 * Application environment.
 */
export const Env = {
  STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  ANALYZE: process.env.ANALYZE === 'true',
  DEV: process.env.NODE_ENV === 'development',
  PROD: process.env.NODE_ENV === 'production',
} as const
