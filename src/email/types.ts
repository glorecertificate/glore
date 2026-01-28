import { type TailwindConfig } from '@react-email/tailwind'
import { type MessageAttachment, type SMTPConnectionOptions } from 'emailjs'
import { createTranslator, type Locale } from 'next-intl'

import { type DatabaseHookPayload } from '@/db/types'
import { mailer } from '@/email/config'
import { i18n } from '@/lib/i18n'
import { type Replace } from '@/lib/types'

export type EmailTemplate = 'auth/recovery' | 'auth/invite'

export type EmailTemplateOptions<T extends EmailTemplate> = {
  'auth/recovery': AuthEmailProps
  'auth/invite': AuthEmailProps
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
    messages: await import(`~/messages/${locale}`),
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
