import { createTranslator } from 'next-intl'

import { mailer } from '@/email/config'
import {
  type AccountEmailChangedProps,
  type AuthEmailProps,
  type EmailTemplate,
  type EmailTemplateOptions,
  type TeamInviteEmailProps,
} from '@/email/types'
import { i18n } from '@/lib/i18n'
import { type Replace } from '@/lib/types'

export const getEmailTranslations = async <T extends `Email.${EmailTemplate | 'common'}`>(
  namespace: T,
  locale = i18n.defaultLocale
) => {
  const imported = await import(`~/messages/${locale}`)

  return createTranslator({
    namespace,
    locale,
    messages: imported.default ?? imported,
  })
}

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

export const teamEmailPreviewProps = <T extends Replace<Extract<EmailTemplate, `team/${string}`>, 'team/'>>(
  props?: Omit<EmailTemplateOptions<`team/${T}`>, 'to' | keyof TeamInviteEmailProps>
) => ({
  ...mailer.preview,
  inviteeName: 'Jane Smith',
  role: 'editor' as const,
  joinUrl: `${mailer.preview.redirectTo}/auth/callback?next=/admin`,
  ...props,
})

export const accountEmailPreviewProps = <T extends Replace<Extract<EmailTemplate, `account/${string}`>, 'account/'>>(
  props?: Omit<EmailTemplateOptions<`account/${T}`>, 'to' | keyof AccountEmailChangedProps>
) => ({
  ...mailer.preview,
  newEmail: 'new.email@example.com',
  oldEmail: 'old.email@example.com',
  variant: 'new' as const,
  ...props,
})
