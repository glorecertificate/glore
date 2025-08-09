'use client'

import { useCallback, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthForm } from '@/components/features/auth/auth-form'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { EmailSentGraphic } from '@/components/ui/graphics/email-sent'
import { PasswordResetGraphic } from '@/components/ui/graphics/password-reset'
import { Input } from '@/components/ui/input'
import { Link } from '@/components/ui/link'
import { useDatabase } from '@/hooks/use-database'
import { useTranslations } from '@/hooks/use-translations'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'
import { Route } from '@/lib/navigation'

export const PasswordResetForm = (props: React.ComponentPropsWithoutRef<'form'>) => {
  const db = useDatabase()
  const t = useTranslations('Auth')
  const [isSubmitting, setSubmitting] = useState(false)
  const [showSuccess, setSuccess] = useState(false)

  const formSchema = useMemo(
    () =>
      z.object({
        user: z
          .string()
          .nonempty(t('userRequired'))
          .min(2, {
            message: t('userInvalid'),
          }),
      }),
    [t],
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user: '',
    },
  })

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      setSubmitting(true)

      const user = schema.user.trim()

      try {
        const { data, error: userError } = await db
          .from('users')
          .select()
          .or(`email.eq.${user},username.eq.${user}`)
          .single()
        if (userError) throw userError
        if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

        const { error } = await db.auth.resetPasswordForEmail(data.email)
        if (error) throw error

        setSubmitting(false)
        setSuccess(true)
      } catch (e) {
        setSubmitting(false)

        const error = e as DatabaseError
        const dbError = new DatabaseError(error.code, error.message)

        if (
          dbError.code !== PostgRESTCode.NETWORK_ERROR &&
          (!error.code || dbError.code === PostgRESTCode.NO_RESULTS)
        ) {
          return form.setError('user', { message: t('userNotFound') })
        }

        return toast.error(t('networkError'))
      }
    },
    [db, form, t],
  )

  return showSuccess ? (
    <AuthForm
      disabledTitle={t('insertEmail')}
      header={
        <div className="flex flex-col gap-2">
          <EmailSentGraphic className="mb-4 size-64" />
          <h1 className="text-2xl font-bold">{t('passwordResetSent')}</h1>
          <p className="mb-2 text-left text-balance text-muted-foreground">{t('passwordResetMessage')}</p>
          <Button asChild variant="outline">
            <Link className="hover:no-underline" href={Route.Login}>
              {t('backToLogin')}
            </Link>
          </Button>
        </div>
      }
      {...props}
    />
  ) : (
    <>
      <AuthForm
        className="mt-2 gap-4"
        footer={
          <div className="flex w-full justify-end">
            <Button
              asChild
              className="text-[13px] text-muted-foreground"
              effect="hoverUnderline"
              size="text"
              variant="link"
            >
              <Link href={Route.Login}>{t('backToLogin')}</Link>
            </Button>
          </div>
        }
        form={form}
        header={
          <div className="mb-2 flex flex-col gap-2">
            <PasswordResetGraphic className="mb-4 w-72" />
            <h1 className="text-2xl font-bold">{t('passwordResetTitle')}</h1>
            <p className="mb-2 text-left text-sm text-muted-foreground">{t('passwordResetSubtitle')}</p>
          </div>
        }
        loading={isSubmitting}
        onSubmit={form.handleSubmit(onSubmit)}
        subtitle={t('passwordResetSubtitle')}
        title={t('passwordResetTitle')}
        {...props}
      >
        <FormField
          control={form.control}
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('userLabel')}</FormLabel>
              <FormControl>
                <Input autoFocus placeholder="me@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </AuthForm>
    </>
  )
}
