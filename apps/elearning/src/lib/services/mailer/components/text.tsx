import { Text, type TextProps } from '@react-email/components'

import { cn } from '@/lib/utils'

export const EmailText = ({ className, ...props }: TextProps) => (
  <Text className={cn('text-base', className)} {...props} />
)
