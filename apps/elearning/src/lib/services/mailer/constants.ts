import metadata from '@config/metadata'
import theme from '@config/theme'

import { type EmailTemplate, type SendEmailOptions } from './types'

export const MAIL_APP_URL = process.env.APP_URL ?? metadata.url

export const SMTP_CONFIG = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  ssl: true,
  tls: false,
} as const

export const EMAIL_THEME = {
  colors: {
    brand: theme.colors.light.brand,
    offwhite: '#f9fbfb',
    success: theme.colors.light.success,
    link: '#5ab9d2',
  },
  fontFamily: {
    sansSerif:
      'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  },
} as const

export const EMAIL_PREVIEW_PROPS = {
  from: process.env.EMAIL_SENDER,
  to: 'john.doe@example.com',
  username: 'John Doe',
  locale: 'it',
  token: '123456',
  tokenHash: 'abcdef1234567890',
  tokenNew: '654321',
  tokenHashNew: '098765fedcba',
  redirectTo: MAIL_APP_URL,
} as const satisfies SendEmailOptions<EmailTemplate>
