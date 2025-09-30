import './lib/dotenv'
import { Env } from './lib/schema'
import { defineEnv } from './lib/utils'

export const MailEnv = defineEnv(
  Env.pick({
    APP_URL: true,
    EMAIL_SENDER: true,
    NODE_ENV: true,
    SMTP_HOST: true,
    SMTP_PASSWORD: true,
    SMTP_USER: true,
    STORAGE_URL: true,
    WEBSITE_URL: true,
  })
)

export type MailEnv = typeof MailEnv

declare global {
  namespace NodeJS {
    interface ProcessEnv extends MailEnv {}
  }
}
