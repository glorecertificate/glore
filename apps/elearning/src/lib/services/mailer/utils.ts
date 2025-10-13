import { type Replace } from '@glore/utils/types'

import { EMAIL_PREVIEW_PROPS } from './constants'
import { type AuthEmailOptions, type EmailTemplate, type SendEmailOptions } from './types'

export const previewProps = <T extends EmailTemplate>(props?: Omit<SendEmailOptions<T>, 'to'>) => ({
  ...EMAIL_PREVIEW_PROPS.common,
  ...props,
})

export const authPreviewProps = <T extends Replace<Extract<EmailTemplate, `auth/${string}`>, 'auth/'>>(
  props?: Omit<SendEmailOptions<`auth/${T}`>, 'to' | keyof AuthEmailOptions>
) => ({
  ...EMAIL_PREVIEW_PROPS.common,
  ...EMAIL_PREVIEW_PROPS.auth,
  ...props,
})
