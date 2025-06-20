'use client'

import { redirect } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthForm } from '@/components/features/auth/auth-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Image } from '@/components/ui/image'
import { Input } from '@/components/ui/input'
import { Link } from '@/components/ui/link'
import { PasswordInput } from '@/components/ui/password-input'
import { useTranslations } from '@/hooks/use-translations'
import { db } from '@/lib/db/client'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'
import { externalRoute, Route } from '@/lib/navigation'
import { asset } from '@/lib/storage'

const LoginFormFooter = () => {
  const t = useTranslations()

  return (
    <Dialog>
      <div className="mt-1 text-center text-sm text-muted-foreground">
        {t.rich('Auth.signupMessage', {
          link: content => (
            <DialogTrigger asChild>
              <Button className="font-medium text-muted-foreground" variant="link">
                {content}
              </Button>
            </DialogTrigger>
          ),
        })}
      </div>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="mb-2 flex items-center gap-2 font-medium">
            {t('Auth.signupDialogTitle')}
            <Image src={asset('assets/logo.png')} width={24} />
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {t.rich('Auth.signupDialogMessage', {
            b: content => <span className="font-semibold">{content}</span>,
            p: content => <p>{content}</p>,
            link: content => (
              <Link
                className="text-base text-muted-foreground underline underline-offset-4 hover:text-foreground"
                href={externalRoute('Website')}
                target="_blank"
              >
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

      let user
      const username = schema.user.trim()
      const password = schema.password.trim()

      try {
        const { data, error } = await db
          .from('users')
          .select('email, username')
          .or(`email.eq.${username},username.eq.${username}`)
          .single()
        if (error) throw error
        if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)
        user = data
      } catch (e) {
        setSubmitting(false)
        const error = e as DatabaseError
        console.error(e)
        if (error.code === PostgRESTCode.NO_RESULTS) return form.setError('user', { message: t('userNotFound') })
        return toast.error(t('networkError'))
      }

      try {
        const { error } = await db.auth.signInWithPassword({
          email: user.email || '',
          password,
        })
        if (error) throw error
      } catch (e) {
        setSubmitting(false)
        const error = e as DatabaseError
        console.error(e)
        if (error.code === PostgRESTCode.INVALID_CREDENTIALS) {
          return form.setError('password', { message: t('passwordInvalid') })
        }
        return toast.error(t('networkError'))
      }

      redirect(Route.Home)
    },
    [form, t, setSubmitting],
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
              <Input placeholder="me@example.com" variant="primary" {...field} />
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
              <Link className="text-sm text-muted-foreground hover:text-foreground" href={Route.PasswordReset}>
                {t('forgotPassword')}
              </Link>
            </div>
            <FormControl>
              <PasswordInput variant="primary" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </AuthForm>
  )
}
