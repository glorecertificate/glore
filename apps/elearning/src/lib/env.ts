import { z } from 'zod'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof Env> {}
  }
}

export const Env = z.object({
  APP_URL: z.url(),
  COOKIE_PREFIX: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z
    .enum([
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4o-nano',
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-nano',
    ])
    .default('gpt-4o'),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
})
