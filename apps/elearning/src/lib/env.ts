import metadata from '@config/metadata'
import { defineEnv } from '@repo/env'

export const env = defineEnv({
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.APP_URL,
  COOKIE_PREFIX: process.env.COOKIE_PREFIX ?? `${metadata.slug}.`,
  STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
} as const)
