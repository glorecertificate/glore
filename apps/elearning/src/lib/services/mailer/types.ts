import { type TailwindConfig } from '@react-email/tailwind'
import { Message, type MessageAttachment, type SMTPConnectionOptions } from 'emailjs'
import { type Locale } from 'next-intl'

import { type EMAIL_TEMPLATES } from './constants'

/**
 * Options for sending an email.
 */
export interface EmailOptions {
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

/**
 * Options for sending authentication-related emails.
 */
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
 * Options for sending an email with a specific template.
 */
export type SendEmailOptions<T extends EmailTemplate> = Omit<TemplateOptions<T>, 'locale'> & {
  /**
   * Locale used to render the email, defaults to the configured default locale.
   */
  locale?: Locale
  /**
   * Custom SMTP settings overriding the default configuration.
   */
  smtp?: Partial<SMTPConnectionOptions>
}

/**
 * Available email templates.
 */
export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number]

/**
 * Mapping of email templates to their specific properties.
 */
export type TemplateOptions<T extends EmailTemplate> = {
  'auth/recovery': AuthEmailProps
  'auth/invite': AuthEmailProps
}[T]

/**
 * Properties passed to an email template.
 */
export interface EmailProps extends EmailOptions {
  /**
   * Locale used to render the email.
   */
  locale: Locale
}

/**
 * Properties passed to an authentication-related email template.
 */
export interface AuthEmailProps extends EmailProps, AuthEmailOptions {}

export {
  /**
   * Message instance returned by the `sendEmail` method.
   */
  Message,
}
