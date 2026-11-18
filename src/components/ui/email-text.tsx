import { Fragment } from 'react'

import { cn } from '@/lib/utils'

interface EmailTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  email: string
}

export const EmailText = ({ className, email, ...props }: EmailTextProps) => (
  <span className={cn('wrap-break-word', className)} {...props}>
    {email.split(/(?=[@.])/u).map((part, index) => (
      <Fragment key={`${part}-${index}`}>
        {index > 0 && <wbr />}
        {part}
      </Fragment>
    ))}
  </span>
)
