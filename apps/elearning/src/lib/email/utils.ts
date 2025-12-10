import { createTranslator } from 'next-intl'

import type { Replace } from '@glore/utils/types'

import { emailConfig } from '@/lib/email/config'
import { i18n } from '@/lib/i18n'
import type { AuthEmailProps, EmailTemplate, EmailTemplateOptions } from './types'

export const getEmailTranslations = async <T extends `Email.${EmailTemplate | 'common'}`>(
  namespace: T,
  locale = i18n.defaultLocale
) =>
  createTranslator({
    namespace,
    locale,
    messages: await import(`@config/translations/${locale}`),
  })

export const previewProps = <T extends EmailTemplate>(props?: Omit<EmailTemplateOptions<T>, 'to'>) => ({
  ...emailConfig.preview,
  ...props,
})

export const authPreviewProps = <T extends Replace<Extract<EmailTemplate, `auth/${string}`>, 'auth/'>>(
  props?: Omit<EmailTemplateOptions<`auth/${T}`>, 'to' | keyof AuthEmailProps>
) => ({
  ...emailConfig.preview,
  ...props,
})
