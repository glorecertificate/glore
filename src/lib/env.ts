import z from 'zod'

const schema = z.object({
  APP_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().regex(/^[A-Za-z0-9+/]{43}=$/),
  COOKIE_PREFIX: z.string().optional(),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().regex(/^[0-9a-f]{32}$/),
  R2_ACCESS_KEY_ID: z.string().regex(/^[0-9a-f]{32}$/),
  R2_SECRET_ACCESS_KEY: z.string().regex(/^[0-9a-f]{64}$/),
  R2_BUCKET_NAME: z.string().regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/),
  R2_PUBLIC_URL: z.url(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.enum(['25', '465', '587']),
  SMTP_SENDER: z.string().min(1),
  SMTP_USER: z.email(),
  SMTP_PASSWORD: z.string().min(1),
})

export const validateEnv = () => schema.parse(process.env)

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof schema> {}
  }
}
