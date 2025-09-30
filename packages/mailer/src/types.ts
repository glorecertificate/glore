import { type TailwindConfig } from '@react-email/tailwind'
import { type User } from '@supabase/supabase-js'
import { Message, type MessageAttachment, type SMTPConnectionOptions } from 'emailjs'

import { type Formatter, type Locale, type Messages } from '@glore/i18n'
import { type AnyRecord, type Replace } from '@glore/utils/types'

import { type mailer } from './config'
import { type AuthRecoveryProps } from './templates/auth/recovery'

export type EmailTemplate = (typeof mailer.templates)[number]

type EmailPropsMap<T extends Record<EmailTemplate, AnyRecord>> = T

export type EmailTemplateProps = EmailPropsMap<{
  'auth/recovery': AuthRecoveryProps
}>

export type AuthEmailAction = 'email_change' | 'email' | 'invite' | 'magiclink' | 'signup' | 'recovery'

export interface AuthEmailInput {
  email_data: {
    email_action_type: AuthEmailAction
    redirect_to: string
    site_url: string
    token_hash_new: string
    token_hash: string
    token_new: string
    token: string
  }
  user: User
}

interface SharedOptions {
  /** Custom footer content to append above the default footer. */
  footer?: React.ReactNode
  /** Email sender address. */
  from?: string
  /** Additional elements to include in the `<head>` of the email. */
  head?: React.ReactNode
  /** Locale used to render the email, defaults to the `Mailer` instance's locale. */
  locale?: Locale
  /** URL to override the default email logo. */
  logo?: string
  /** Custom Tailwind CSS configuration that extends the default styles. */
  tailwindConfig?: Omit<Exclude<TailwindConfig['theme'], undefined>, 'extend'>
}

export interface MailerOptions extends Partial<SMTPConnectionOptions>, SharedOptions {}

export interface EmailOptions extends SharedOptions {
  /** Optional attachments to include. */
  attachments?: MessageAttachment[]
  /** Override the default preview. */
  preview?: string
  /** Override the default subject. */
  subject?: string
  /** Email recipient(s). */
  to: string | string[]
  /** String used to greet the user, if available. */
  username?: string
}

interface IntlOptions<T extends EmailTemplate> {
  /** Formatter instance for the email locale. */
  f: Formatter
  /** Translations for the template including common strings. */
  t: Messages['Email'][T] & {
    common: Messages['Email']['common']
  }
}

export type SendEmailOptions<T extends EmailTemplate> = Omit<EmailTemplateProps[T], keyof IntlOptions<T>>

export interface EmailProps<T extends EmailTemplate> extends EmailOptions, IntlOptions<T> {}

/** @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook */
export interface AuthEmailOptions {
  /** URL for redirection after the action is completed. */
  redirectTo: string
  /** Original token sent by Supabase. */
  token: string
  /** Hashed token sent by Supabase. */
  tokenHash: string
  /** Hashed new token sent by Supabase (email change). */
  tokenHashNew: string
  /** New token sent by Supabase (email change). */
  tokenNew: string
}

export interface AuthEmailProps<T extends Replace<EmailTemplate, 'auth/'>>
  extends EmailProps<`auth/${T}`>,
    AuthEmailOptions {}

export type PreviewProps<T extends EmailTemplate> = EmailTemplateProps[T] & {
  t: Messages['Email'][T]
}

export {
  /** Message instance returned by `Mailer.sendEmail`. */
  Message,
}
