'use client'

import { redirect } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { DialogTitle } from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthForm } from '@/components/auth/auth-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from '@/components/ui/dialog'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Image } from '@/components/ui/image'
import { Input } from '@/components/ui/input'
import { Link } from '@/components/ui/link'
import { PasswordInput } from '@/components/ui/password-input'
import { useDB } from '@/hooks/use-db'
import { externalUrl, Route } from '@/lib/navigation'
import { Asset } from '@/lib/storage'
import { DatabaseError, DatabaseErrorCode } from '@/services/db'

const LoginFormFooter = () => {
  const t = useTranslations()

  return (
    <Dialog>
      <div className="mt-1 text-center text-[13px]">
        {t.rich('Auth.signupMessage', {
          link: content => (
            <DialogTrigger asChild>
              <Button className="text-[13px] font-medium" variant="link">
                {content}
              </Button>
            </DialogTrigger>
          ),
        })}
      </div>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-md flex gap-2 font-medium">
            {t('Auth.signupDialogTitle')}
            <Image src={Asset.Logo} width={20} />
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {t.rich('Auth.signupDialogMessage', {
            b: content => <span className="font-semibold">{content}</span>,
            p: content => <p className="text-sm text-muted-foreground">{content}</p>,
            link: content => (
              <Link className="underline underline-offset-4" external href={externalUrl('Website')} target="_blank">
                {content}
              </Link>
            ),
          })}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('Common.close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const LoginForm = (props: React.ComponentPropsWithoutRef<'form'>) => {
  const db = useDB()
  const t = useTranslations('Auth')
  const [submitting, setSubmitting] = useState(false)

  const formSchema = useMemo(
    () =>
      z.object({
        user: z
          .string()
          .nonempty(t('userRequired'))
          .min(2, {
            message: t('userInvalid'),
          }),
        password: z
          .string()
          .nonempty(t('passwordRequired'))
          .min(8, {
            message: t('passwordInvalid'),
          }),
      }),
    [t],
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user: '',
      password: '',
    },
  })

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      setSubmitting(true)

      let profile
      const user = schema.user.trim()
      const password = schema.password.trim()

      try {
        const { data, error } = await db.from('profiles').select().or(`email.eq.${user},username.eq.${user}`).single()
        if (error) throw error
        if (!data) throw new DatabaseError(DatabaseErrorCode.NO_RESULTS)
        profile = data
      } catch (e) {
        setSubmitting(false)
        const error = e as DatabaseError
        console.error(e)
        if (error.code === DatabaseErrorCode.NO_RESULTS) {
          return form.setError('user', { message: t('userNotFound') })
        }
        return toast.error(t('networkError'))
      }

      try {
        const { error } = await db.auth.signInWithPassword({
          email: profile?.email || '',
          password,
        })
        if (error) throw error
      } catch (e) {
        setSubmitting(false)
        const error = e as DatabaseError
        console.error(e)
        if (error.code === DatabaseErrorCode.INVALID_CREDENTIALS) {
          return form.setError('password', { message: t('passwordInvalid') })
        }
        return toast.error(t('networkError'))
      }

      redirect(Route.Home)
    },
    [db, form, t],
  )

  return (
    <AuthForm
      className="mt-8"
      footer={<LoginFormFooter />}
      form={form}
      loading={submitting}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel={t('login')}
      submitLoadingLabel={t('loggingIn')}
      subtitle={t('loginSubtitle')}
      title={t('loginTitle')}
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
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>{t('passwordLabel')}</FormLabel>
              <Link className="text-[13px]" href={Route.PasswordReset}>
                {t('forgotPassword')}
              </Link>
            </div>
            <FormControl>
              <PasswordInput {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </AuthForm>
  )
}
