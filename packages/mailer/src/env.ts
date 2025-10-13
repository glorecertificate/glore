import { z } from 'zod'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof MailerEnv> {}
  }
}

export const MailerEnv = z.object({
  APP_URL: z.url(),
  STORAGE_URL: z.url(),
  EMAIL_SENDER: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.enum(['25', '465', '587', '2525']),
  SMTP_PASSWORD: z.string(),
  SMTP_USER: z.email(),
})

MailerEnv.parse(process.env)
