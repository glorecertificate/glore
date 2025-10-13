import { Text as EmailText, type TextProps } from '@react-email/components'

import { cn } from '@glore/mailer/utils'

export const Text = ({ className, ...props }: TextProps) => (
  <EmailText className={cn('text-base', className)} {...props} />
)
