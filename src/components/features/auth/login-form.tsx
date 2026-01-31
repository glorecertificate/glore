'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { redirect } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { login } from '@/actions/auth'
import { findUserEmail } from '@/actions/user'
import { type AuthView } from '@/components/features/auth/auth-flow'
import { SignupDialog } from '@/components/features/auth/signup-dialog'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { APP_ROOT, PASSWORD_REGEX } from '@/lib/constants'
import { type Enum } from '@/lib/types'
import { cn, defaultFormDisabled, isValidUsername } from '@/lib/utils'

export const LoginForm = ({
  setErrored,
  setUsername,
  setView,
  username,
}: {
  setErrored: (hasErrors: boolean) => void
  setUsername: (username?: string) => void
  setView: (view: Enum<AuthView>) => void
  username?: string
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
      username: username ?? '',
      password: '',
    },
  })

  const disabled = defaultFormDisabled(form)
  const hasErrors = Object.keys(form.formState.errors).length > 0
  const passwordError = form.formState.errors.password

  const setPasswordInvalid = useCallback(() => {
    form.setError(
      'password',
      {
        message: t('passwordInvalid'),
        type: 'validate',
      },
      { shouldFocus: true }
    )
  }, [form, t])

  const setPasswordReset = useCallback(() => {
    setUsername(form.getValues('username'))
    setView('password_request')
  }, [form, setUsername, setView])

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      setLoading(true)

      const username = schema.username.trim()
      const password = schema.password.trim()

      const { data, error } = await findUserEmail(username)
      if (error) {
        setLoading(false)
        if (error.code === 'PGRST116') {
          form.setError('username', { message: t('userNotFound') })
          return form.setFocus('username')
        }
        console.error(error)
        return toast.error(t('networkError'))
      }

      if (!PASSWORD_REGEX.test(password)) {
        return setPasswordInvalid()
      }

      const { error: loginError } = await login({ email: data.email, password })
      if (loginError) {
        setLoading(false)
        if (loginError.code === '28P01') {
          return setPasswordInvalid()
        }
        console.error(loginError)
        return toast.error(t('networkError'))
      }

      redirect(APP_ROOT)
    },
    [form, t, setPasswordInvalid]
  )

  useEffect(() => {
    setErrored(hasErrors)
  }, [hasErrors, setErrored])

  useEffect(() => (username ? form.setFocus('password') : form.setFocus('username')), [username, form.setFocus, form])

  // biome-ignore lint/correctness: Run on unmount only
  useEffect(
    () => () => {
      setLoading(false)
      setErrored(false)
    },
    []
  )

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
                      autoFocus={!username}
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
                    <PasswordInput autoFocus={!!username} disabled={loading} variant="floating" {...field} />
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
            disabled={disabled}
            disabledTitle={t('insertCredentials')}
            loading={loading}
            type="submit"
            variant="brand"
          >
            {loading ? t('loggingIn') : t('login')}
          </Button>
        </form>
      </Form>
      <SignupDialog loading={loading} />
    </>
  )
}
