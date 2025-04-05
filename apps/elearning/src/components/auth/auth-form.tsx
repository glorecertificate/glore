'use client'

import { useTranslations } from 'next-intl'
import { type FieldValues, type UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

export type AuthFormProps<T extends FieldValues> = React.ComponentProps<'form'> & {
  footer?: React.ReactNode
  form?: UseFormReturn<T>
  header?: React.ReactNode
  loading?: boolean
  onSubmit?: React.FormEventHandler<HTMLFormElement> | undefined
  submitLabel?: string
  subtitle?: string
  title?: string
}

export const AuthForm = <T extends FieldValues>({
  children,
  footer,
  form,
  header,
  loading,
  onSubmit,
  submitLabel,
  subtitle,
  title,
  ...props
}: AuthFormProps<T>) => {
  const t = useTranslations('Common')

  return (
    <div className="flex flex-col gap-6">
      {header ??
        ((title || subtitle) && (
          <div className="flex flex-col gap-2 text-center">
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        ))}
      {form && (
        <Form {...form}>
          <form onSubmit={onSubmit} {...props}>
            <div className="mb-4 grid gap-6">
              <div className="grid gap-4">{children}</div>
              <Button className="w-full [&_svg]:size-4" loading={loading} type="submit" variant="secondary">
                {submitLabel ? submitLabel : t('submit')}
              </Button>
            </div>
            {footer}
          </form>
        </Form>
      )}
    </div>
  )
}
