import { z } from 'zod'

export const Env = z.object({
  APP_URL: z.url(),
  AUTH_EMAIL_HOOK_SECRET: z.string().startsWith('v1,'),
  COOKIE_PREFIX: z.string(),
  EMAIL_SENDER: z.string(),
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
      'o1',
      'o1-mini',
      'o3',
      'o3-mini',
      'o4',
      'o4-mini',
    ])
    .default('gpt-4o'),
  SMTP_HOST: z.string(),
  SMTP_PASSWORD: z.string(),
  SMTP_USER: z.email(),
  STORAGE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_DB_URL: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_URL: z.url(),
  WEBSITE_URL: z.url(),
})

export const PublicEnv = z.object({
  NEXT_PUBLIC_STORAGE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
})

export const GlobalEnv = Env.extend(PublicEnv.shape)

export const MailEnv = Env.pick({
  EMAIL_SENDER: true,
  NODE_ENV: true,
  SMTP_HOST: true,
  SMTP_PASSWORD: true,
  SMTP_USER: true,
  STORAGE_URL: true,
  WEBSITE_URL: true,
})

export type Env = z.infer<typeof Env>
export type PublicEnv = z.infer<typeof PublicEnv>
export type GlobalEnv = z.infer<typeof GlobalEnv>
export type MailEnv = z.infer<typeof MailEnv>
