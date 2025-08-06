'use client'

import { useMemo } from 'react'

import { type FieldValues, type UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'

export interface AuthFormProps<T extends FieldValues> extends React.ComponentProps<'form'> {
  disabledTitle?: string
  footer?: React.ReactNode
  form?: UseFormReturn<T>
  header?: React.ReactNode
  loading?: boolean
  onSubmit?: React.FormEventHandler<HTMLFormElement> | undefined
  submitDisabled?: boolean
  submitLabel?: string
  submitLoadingLabel?: string
  subtitle?: string
  title?: string
}

const defaultSubmitDisabled = <T extends FieldValues>(form?: UseFormReturn<T>) =>
  !form?.formState.isDirty || Object.keys(form.formState.errors).length > 0

export const AuthForm = <T extends FieldValues>({
  children,
  className,
  footer,
  form,
  disabledTitle,
  header,
  loading,
  onSubmit,
  submitDisabled = defaultSubmitDisabled(form),
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
          <div className="mb-2 flex flex-col gap-2 text-center">
            {title && <h1 className="text-3xl font-bold">{title}</h1>}
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        ))}
      {form && (
        <Form {...form}>
          <form className={cn('mt-4 grid gap-6', footer && 'mb-2', className)} onSubmit={onSubmit} {...props}>
            <div className="grid gap-4">{children}</div>
            <Button
              className="w-full [&_svg]:size-4"
              disabled={submitDisabled}
              disabledCursor
              disabledTitle={disabledTitle}
              loading={loading}
              type="submit"
              variant="brand"
            >
              {buttonLabel}
            </Button>
          </form>
        </Form>
      )}
      {footer}
    </div>
  )
}
