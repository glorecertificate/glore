'use client'

import { useTranslations } from 'next-intl'

import { useFormField } from '@/components/ui/form'
import { cn } from '@/lib/utils'

export const FieldError = ({ className, ...props }: React.ComponentProps<'p'>) => {
  const t = useTranslations('CertificateErrors')
  const { error, formMessageId } = useFormField()
  const code = error?.message ?? error?.root?.message
  if (!code) return null

  const key = (t.has(code as never) ? code : 'invalid') as never

  return (
    <p
      className={cn('text-sm leading-[normal] text-destructive-text', className)}
      data-slot="form-message"
      id={formMessageId}
      {...props}
    >
      {t(key)}
    </p>
  )
}
