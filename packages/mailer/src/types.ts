import { type TailwindConfig } from '@react-email/tailwind'
import { Message, type MessageAttachment, type SMTPConnectionOptions } from 'emailjs'

import { type Locale, type Messages } from '@glore/i18n'
import { type createFormatter } from '@glore/mailer/utils'
import { type Replace } from '@glore/utils/types'

import { type mailerConfig } from './config'
import { type AuthRecoveryProps } from './templates/auth/recovery'

interface EmailBaseOptions {
  /**
   * Optional attachments to include.
   */
  attachments?: MessageAttachment[]
  /**
   * Custom content to append above the default footer.
   */
  footer?: React.ReactNode
  /**
   * Email sender address.
   */
  from?: string
  /**
   * Additional elements to include in the head of the email.
   */
  head?: React.ReactNode
  /**
   * Locale used to render the email, defaults to the configured default locale.
   */
  locale?: Locale
  /**
   * URL to override the default email logo.
   */
  logo?: string
  /**
   * Override the default preview text.
   */
  preview?: string
  /**
   * Override the default email subject.
   */
  subject?: string
  /**
   * Custom Tailwind CSS configuration to extend the default styles.
   */
  tailwindConfig?: Omit<Exclude<TailwindConfig['theme'], undefined>, 'extend'>
  /**
   * Email recipient(s).
   */
  to: string | string[]
  /**
   * String used to greet the user, if available.
   */
  username?: string
}

interface EmailIntlOptions<T extends EmailTemplate> {
  /**
   * Formatter instance for the email's locale.
   */
  f: ReturnType<typeof createFormatter>
  /**
   * Translations for a template including common strings.
   */
  t: Messages['Email'][T] & {
    common: Messages['Email']['common']
  }
}

/**
 * Available email templates.
 */
export type EmailTemplate = (typeof mailerConfig.templates)[number]

type EmailTemplateOptions<T extends EmailTemplate> = {
  'auth/recovery': AuthRecoveryProps
}[T]

/**
 * Options for sending an email.
 */
export type EmailOptions<T extends EmailTemplate> = Omit<EmailTemplateOptions<T>, keyof EmailIntlOptions<T>> & {
  /**
   * Custom SMTP settings to override the default configuration.
   */
  smtp?: Partial<SMTPConnectionOptions>
}

/**
 * Properties passed to an email template.
 */
export interface EmailProps<T extends EmailTemplate> extends Omit<EmailBaseOptions, 'smtp'>, EmailIntlOptions<T> {}

export interface AuthEmailOptions {
  /**
   * URL for redirection after the action is completed.
   */
  redirectTo: string
  /**
   * Original token for the action.
   */
  token: string
  /**
   * Hashed token for verification.
   */
  tokenHash: string
  /**
   * New hashed token sent on email change.
   */
  tokenHashNew: string
  /**
   * New token sent on email change.
   */
  tokenNew: string
}

/**
 * Properties passed to an authentication email template.
 */
export interface AuthEmailProps<T extends Replace<EmailTemplate, 'auth/'>>
  extends EmailProps<`auth/${T}`>,
    AuthEmailOptions {}

/**
 * Options for sending a preview email.
 */
export type PreviewProps<T extends EmailTemplate> = EmailTemplateOptions<T> & {
  t: Messages['Email'][T]
}

export {
  /**
   * Message instance returned by the `sendEmail` method.
   */
  Message,
}
