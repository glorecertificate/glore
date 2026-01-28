import { createTranslator } from 'next-intl'

import { mailer } from '@/email/config'
import { type AuthEmailProps, type EmailTemplate, type EmailTemplateOptions } from '@/email/types'
import { i18n } from '@/lib/i18n'
import { type Replace } from '@/lib/types'

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
