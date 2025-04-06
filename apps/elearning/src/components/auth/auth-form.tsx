'use client'

import { useMemo } from 'react'

import { useTranslations } from 'next-intl'
import { type FieldValues, type UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { cn } from '@/lib/utils'

export type AuthFormProps<T extends FieldValues> = React.ComponentProps<'form'> & {
  footer?: React.ReactNode
  form?: UseFormReturn<T>
  header?: React.ReactNode
  loading?: boolean
  onSubmit?: React.FormEventHandler<HTMLFormElement> | undefined
  submitLabel?: string
  submitLoadingLabel?: string
  subtitle?: string
  title?: string
}

export const AuthForm = <T extends FieldValues>({
  children,
  className,
  footer,
  form,
  header,
  loading,
  onSubmit,
  submitLabel,
  submitLoadingLabel,
  subtitle,
  title,
  ...props
}: AuthFormProps<T>) => {
  const t = useTranslations('Common')

  const buttonLabel = useMemo(() => {
    if (!submitLabel) return t('submit')
    if (loading && submitLoadingLabel) return submitLoadingLabel
    return submitLabel
  }, [loading, submitLabel, submitLoadingLabel, t])

  return (
    <div className="flex flex-col">
      {header ??
        ((title || subtitle) && (
          <div className="flex flex-col gap-1 text-center">
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        ))}
      {form && (
        <Form {...form}>
          <form className={cn('grid gap-4', footer && 'mb-2', className)} onSubmit={onSubmit} {...props}>
            <div className="grid gap-4">{children}</div>
            <Button className="w-full [&_svg]:size-4" color="secondary" loading={loading} type="submit">
              {buttonLabel}
            </Button>
          </form>
        </Form>
      )}
      {footer}
    </div>
  )
}
