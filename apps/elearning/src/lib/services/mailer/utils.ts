import { createTranslator } from 'next-intl'

import { type Enum, type Replace } from '@glore/utils/types'

import { DEFAULT_LOCALE } from '@/lib/intl'
import { EMAIL_PREVIEW_PROPS } from './constants'
import { type AuthEmailOptions, type EmailTemplate, type SendEmailOptions } from './types'

export const getTranslations = async <T extends `Email.${Enum<EmailTemplate> | 'common'}`>(
  namespace: T,
  options = {
    locale: DEFAULT_LOCALE,
  }
) =>
  createTranslator({
    namespace,
    locale: options.locale,
    messages: await import(`../../../../config/translations/${options.locale}.json`),
  })

export const previewProps = <T extends EmailTemplate>(props?: Omit<SendEmailOptions<T>, 'to'>) => ({
  ...EMAIL_PREVIEW_PROPS,
  ...props,
})

export const authPreviewProps = <T extends Replace<Extract<EmailTemplate, `auth/${string}`>, 'auth/'>>(
  props?: Omit<SendEmailOptions<`auth/${T}`>, 'to' | keyof AuthEmailOptions>
) => ({
  ...EMAIL_PREVIEW_PROPS,
  ...props,
})
