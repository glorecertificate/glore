import type { TailwindConfig } from '@react-email/tailwind'
import type { MessageAttachment, SMTPConnectionOptions } from 'emailjs'
import type { Locale } from 'next-intl'

import type { SendEmailHookInput } from '@/lib/db/types'

/**
 * Available email templates.
 */
export type EmailTemplate = 'auth/recovery'

/**
 * Mapping of email templates to their specific properties.
 */
export type EmailTemplateOptions<T extends EmailTemplate> = {
  'auth/recovery': AuthEmailProps
}[T]

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
   * Custom SMTP settings overriding the default configuration.
   */
  smtp?: Partial<SMTPConnectionOptions>
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
export interface AuthEmailProps extends EmailProps {
  data: SendEmailHookInput['email_data']
}
