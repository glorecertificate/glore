'use client'

import { redirect } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { DialogTitle } from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
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
import { Route } from '@/lib/navigation'
import { Asset } from '@/lib/storage'

const LoginFormFooter = () => {
  const t = useTranslations()

  return (
    <Dialog>
      <div className="text-center text-sm">
        {t.rich('Auth.signupMessage', {
          link: content => (
            <DialogTrigger asChild>
              <Button className="underline underline-offset-4" variant="link">
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
            b: content => <b>{content}</b>,
            p: content => <p className="text-sm text-muted-foreground">{content}</p>,
            link: content => (
              <a className="underline underline-offset-4" href="#">
                {content}
              </a>
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
    },
  })

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      setSubmitting(true)

      const user = schema.user.trim()
      const password = schema.password.trim()

      const { data: profile } = await db.from('profiles').select().or(`email.eq.${user},username.eq.${user}`).single()

      if (!profile) {
        form.setError('user', { message: t('userNotFound') })
        setSubmitting(false)
        return
      }

      const { error } = await db.auth.signInWithPassword({
        email: profile.email,
        password,
      })

      if (error) {
        form.setError('password', { message: t('passwordInvalid') })
        setSubmitting(false)
        return
      }

      redirect(Route.Home)
    },
    [db, form, t],
  )

  return (
    <AuthForm
      footer={<LoginFormFooter />}
      form={form}
      loading={submitting}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel={t('login')}
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
              <Link className="text-sm underline-offset-4 hover:underline" href={Route.PasswordReset}>
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
