'use client'

import { useCallback, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthForm } from '@/components/auth/auth-form'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Image } from '@/components/ui/image'
import { Input } from '@/components/ui/input'
import { Link } from '@/components/ui/link'
import { useDB } from '@/hooks/use-db'
import { Path } from '@/lib/navigation'
import { Asset } from '@/lib/storage'
import { DatabaseError, DatabaseErrorCode } from '@/services/db'

export const PasswordResetForm = (props: React.ComponentPropsWithoutRef<'form'>) => {
  const db = useDB()
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
        const { data, error: profileError } = await db
          .from('profiles')
          .select()
          .or(`email.eq.${user},username.eq.${user}`)
          .single()
        if (profileError) throw profileError
        if (!data) throw new DatabaseError(DatabaseErrorCode.NO_RESULTS)

        const { error } = await db.auth.resetPasswordForEmail(user)
        if (error) throw new DatabaseError(error?.code as DatabaseErrorCode, error?.message)

        setSubmitting(false)
        setSuccess(true)
      } catch (e) {
        setSubmitting(false)

        const error = e as DatabaseError
        const dbError = new DatabaseError(error.code, error.message)

        if (dbError.code !== DatabaseErrorCode.NETWORK_ERROR && (!error.code || dbError.code === DatabaseErrorCode.NO_RESULTS)) {
          return form.setError('user', { message: t('userNotFound') })
        }

        return toast.error(t('networkError'))
      }
    },
    [db, form, t],
  )

  return showSuccess ? (
    <AuthForm
      header={
        <div className="flex flex-col gap-2">
          <Image className="mb-4" src={Asset.EmailSent} width={220} />
          <h1 className="text-2xl font-bold">{t('passwordResetSent')}</h1>
          <p className="mb-2 text-left text-sm text-balance text-muted-foreground">{t('passwordResetMessage')}</p>
          <Button asChild variant="outline">
            <Link className="hover:no-underline" href={Path.Login}>
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
        className="mt-2"
        footer={
          <div className="flex w-full justify-end">
            <Link className="mt-1 text-[13px]" href={Path.Login}>
              {t('backToLogin')}
            </Link>
          </div>
        }
        form={form}
        header={
          <div className="flex flex-col gap-2">
            <Image className="mb-2" src={Asset.PasswordForgot} width={260} />
            <h1 className="text-2xl font-bold">{t('passwordResetTitle')}</h1>
            <p className="mb-2 text-left text-sm text-balance text-muted-foreground">{t('passwordResetSubtitle')}</p>
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
                <Input placeholder="me@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </AuthForm>
    </>
  )
}
