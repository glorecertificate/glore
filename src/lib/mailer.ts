import { type TailwindConfig } from '@react-email/tailwind'
import { type MessageAttachment, type SMTPConnectionOptions } from 'emailjs'
import { createTranslator, type Locale } from 'next-intl'

import { metadata, theme } from '@config/app'
import { type DatabaseHookPayload } from '@/db/types'
import { i18n } from '@/lib/i18n'
import { type Replace } from '@/lib/types'

export const mailer = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    ssl: true,
    tls: false,
  },
  theme: {
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
  },
  preview: {
    from: process.env.SMTP_SENDER,
    to: 'john.doe@example.com',
    username: 'John Doe',
    locale: 'it',
    token: '123456',
    tokenHash: 'abcdef1234567890',
    tokenNew: '654321',
    tokenHashNew: '098765fedcba',
    redirectTo: process.env.APP_URL ?? metadata.url,
  },
}

export type EmailTemplate = 'auth/recovery'

export type EmailTemplateOptions<T extends EmailTemplate> = {
  'auth/recovery': AuthEmailProps
}[T]

export interface EmailOptions {
  attachments?: MessageAttachment[]
  footer?: React.ReactNode
  from?: string
  head?: React.ReactNode
  logo?: string
  preview?: string
  smtp?: Partial<SMTPConnectionOptions>
  subject?: string
  tailwindConfig?: Omit<Exclude<TailwindConfig['theme'], undefined>, 'extend'>
  to: string | string[]
  username?: string
}

export interface EmailProps extends EmailOptions {
  locale?: Locale
}

export interface AuthEmailProps extends EmailProps {
  data: DatabaseHookPayload['email_data']
}

export const getEmailTranslations = async <T extends `Email.${EmailTemplate | 'common'}`>(
  namespace: T,
  locale = i18n.defaultLocale
) =>
  createTranslator({
    namespace,
    locale,
    messages: await import(`@config/translations/${locale}`),
  })

export const emailPreviewProps = <T extends EmailTemplate>(props?: Omit<EmailTemplateOptions<T>, 'to'>) => ({
  ...mailer.preview,
  ...props,
})

export const authEmailPreviewProps = <T extends Replace<Extract<EmailTemplate, `auth/${string}`>, 'auth/'>>(
  props?: Omit<EmailTemplateOptions<`auth/${T}`>, 'to' | keyof AuthEmailProps>
) => ({
  ...mailer.preview,
  ...props,
})
