import metadata from '@config/metadata'
import theme from '@config/theme'

export const APP_URL = process.env.APP_URL ?? metadata.url

export const EMAIL_TEMPLATES = ['auth/recovery', 'auth/invite'] as const

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
  common: {
    from: process.env.EMAIL_SENDER,
    to: 'john.doe@example.com',
    username: 'John Doe',
  },
  auth: {
    token: '123456',
    tokenHash: 'abcdef1234567890',
    tokenNew: '654321',
    tokenHashNew: '098765fedcba',
    redirectTo: process.env.APP_URL,
  },
} as const
