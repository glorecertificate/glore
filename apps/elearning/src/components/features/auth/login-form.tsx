'use client'

import { redirect } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import config from '@config/app'
import type { Enum } from '@glore/utils/types'

import type { AuthView } from '@/components/features/auth/types'
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
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Link } from '@/components/ui/link'
import { PasswordInput } from '@/components/ui/password-input'
import { login } from '@/lib/actions/auth'
import { findUserEmail } from '@/lib/actions/user'
import { PASSWORD_REGEX } from '@/lib/constants'
import { SupabaseError } from '@/lib/db/utils'
import { isFormDisabled, isValidUsername } from '@/lib/forms'
import { cn } from '@/lib/utils'

export const LoginForm = ({
  defaultUsername,
  setErrored,
  setUsername,
  setView,
}: {
  defaultUsername?: string
  setErrored: (hasErrors: boolean) => void
  setUsername: (username?: string) => void
  setView: (view: Enum<AuthView>) => void
}) => {
  const t = useTranslations('Auth')
  const [loading, setLoading] = useState(false)

  const formSchema = useMemo(
    () =>
      z.object({
        username: z
          .string()
          .nonempty(t('userRequired'))
          .min(5, {
            message: t('userTooShort'),
          })
          .refine(isValidUsername, {
            message: t('userInvalid'),
          }),
        password: z
          .string()
          .nonempty(t('passwordRequired'))
          .min(8, {
            message: t('passwordTooShort'),
          }),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: defaultUsername ?? '',
      password: '',
    },
  })

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      setLoading(true)

      const username = schema.username.trim()
      const password = schema.password.trim()
      let email: string

      try {
        email = await findUserEmail(username)
      } catch (e) {
        setLoading(false)
        const error = e as SupabaseError
        if (error.code === 'PGRST116') {
          form.setError('username', { message: t('userNotFound') })
          return form.setFocus('username')
        }
        console.error(e)
        return toast.error(t('networkError'))
      }

      try {
        if (!PASSWORD_REGEX.test(password)) throw new SupabaseError({ code: '28P01' })
        await login({ email, password })
      } catch (e) {
        setLoading(false)
        const error = e as SupabaseError
        if (error.code === '28P01') {
          form.setError('password', { message: t('passwordInvalid'), type: 'validate' }, { shouldFocus: true })
          return
        }
        console.error(e)
        return toast.error(t('networkError'))
      }

      redirect('/')
    },
    [form, t]
  )

  const setPasswordReset = useCallback(() => {
    setUsername(form.getValues('username'))
    setView('password_request')
  }, [form, setUsername, setView])

  const hasErrors = Object.keys(form.formState.errors).length > 0
  const passwordError = form.formState.errors.password

  // biome-ignore lint: exhaustive-deps
  useEffect(() => {
    setErrored(hasErrors)
  }, [hasErrors])

  // biome-ignore lint: exhaustive-deps
  useEffect(() => {
    return defaultUsername ? form.setFocus('password') : form.setFocus('username')
  }, [])

  return (
    <>
      <Form {...form}>
        <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      autoFocus={!defaultUsername}
                      defaultOpen
                      disabled={loading}
                      placeholder={t('userLabel')}
                      variant="floating"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="gap-1">
                  <div className="flex w-full justify-end">
                    <Button
                      className={cn('text-foreground/95', loading && 'pointer-events-none')}
                      disabled={loading}
                      onClick={setPasswordReset}
                      size="text"
                      type="button"
                      variant="link"
                    >
                      {t('forgotPassword')}
                    </Button>
                  </div>
                  <FormControl>
                    <PasswordInput autoFocus={!!defaultUsername} disabled={loading} variant="floating" {...field} />
                  </FormControl>
                  {passwordError && (
                    <p className="text-destructive text-sm leading-[normal]">
                      {passwordError.type === 'validate' ? t('passwordInvalid') : passwordError.message}
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>
          <Button
            className="w-full [&_svg]:size-4"
            disabled={isFormDisabled(form)}
            disabledTitle={t('insertCredentials')}
            loading={loading}
            type="submit"
            variant="brand"
          >
            {loading ? t('loggingIn') : t('login')}
          </Button>
        </form>
      </Form>
      <Dialog>
        <div className="mt-2 text-center text-muted-foreground text-sm">
          {t.rich('signupMessage', {
            link: content => (
              <DialogTrigger asChild>
                <Button
                  className={cn('text-foreground/95', loading && 'pointer-events-none')}
                  disabled={loading}
                  size="text"
                  type="button"
                  variant="link"
                >
                  {content}
                </Button>
              </DialogTrigger>
            ),
          })}
        </div>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-left text-xl">{t('signupDialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {t.rich('signupDialogMessage', {
              p: content => <p>{content}</p>,
              b: content => <span className="font-medium">{content}</span>,
              link: content => (
                <Link className="font-medium" href={config.urls.website} validate={false} variant="underlined">
                  {content}
                </Link>
              ),
            })}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('close')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
