'use client'

import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { login } from '@/actions/auth'
import { findUserEmail } from '@/actions/user'
import { SignupDialog } from '@/components/features/auth/signup-dialog'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { APP_ROOT, PASSWORD_REGEX } from '@/lib/constants'
import { AuthView } from '@/lib/types'
import { cn, isValidUsername } from '@/lib/utils'

export const LoginForm = ({
  errored,
  loggedOut,
  setErrored,
  setUsername,
  setView,
  username,
}: {
  errored: boolean
  loggedOut?: boolean
  setErrored: (errored: boolean) => void
  setUsername: (username?: string) => void
  setView: (view: AuthView) => void
  username?: string
}) => {
  const t = useTranslations('Auth')
  const [loading, setLoading] = useState(false)
  const [passwordReadOnly, setPasswordReadOnly] = useState(Boolean(loggedOut))

  const formSchema = z.object({
    password: z
      .string()
      .nonempty(t('passwordRequired'))
      .min(8, {
        message: t('passwordTooShort'),
      }),
    username: z
      .string()
      .nonempty(t('userRequired'))
      .min(5, {
        message: t('userTooShort'),
      })
      .refine(isValidUsername, {
        message: t('userInvalid'),
      }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      username: username ?? '',
      password: '',
    },
    resolver: zodResolver(formSchema),
  })
  form.watch()
  const formDisabled = errored || loading || !form.getValues('username') || !form.getValues('password')

  const setPasswordInvalid = () => {
    form.setError('password', { message: t('passwordInvalid'), type: 'validate' }, { shouldFocus: true })
  }

  const setPasswordReset = () => {
    setUsername(form.getValues('username'))
    setView('password_request')
    form.reset()
  }

  const onSubmit = async (schema: z.infer<typeof formSchema>) => {
    setLoading(true)

    const { data, error } = await findUserEmail(schema.username.trim())

    if (error?.code === 'NOT_FOUND' || !data) {
      setLoading(false)
      setErrored(true)
      form.setError('username', { message: t('userNotFound') })
      form.setFocus('username')
      return
    }
    if (error) {
      console.error(error)
      toast.error(t('networkError'))
      return
    }

    const password = schema.password.trim()

    if (!PASSWORD_REGEX.test(password)) {
      setPasswordInvalid()
      setLoading(false)
      setErrored(true)
      return
    }

    const { error: loginError } = await login({ email: data.email, password })

    if (loginError) {
      setLoading(false)
      setErrored(true)
      if (loginError.code === 'AUTH_ERROR') {
        setPasswordInvalid()
        return
      }
      console.error(loginError)
      toast.error(t('networkError'))
      return
    }

    redirect(APP_ROOT)
  }

  useEffect(() => {
    if (username) {
      form.setFocus('password')
      return
    }
    form.setFocus('username')
  }, [form, username])

  useEffect(() => {
    if (!loggedOut) return
    const frame = requestAnimationFrame(() => {
      setPasswordReadOnly(false)
      form.setValue('password', '')
      if (username) form.setFocus('password')
    })
    return () => cancelAnimationFrame(frame)
  }, [form, loggedOut, username])

  useEffect(() => {
    if (!errored) return
    const { unsubscribe } = form.watch(() => setErrored(false))
    return () => unsubscribe()
  }, [errored, form, setErrored])

  useEffect(
    () => () => {
      setLoading(false)
      setErrored(false)
    },
    [setErrored]
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
                <FormItem className="gap-1.5">
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
                    <PasswordInput
                      autoFocus={Boolean(username)}
                      disabled={loading}
                      readOnly={passwordReadOnly}
                      variant="floating"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            className="w-full [&_svg]:size-4"
            disabled={formDisabled}
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
