'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { toast } from '@/components/ui/toast'
import { useAutoFocus } from '@/hooks/use-auto-focus'
import { PASSWORD_REGEX } from '@/lib/constants'
import { finePointer } from '@/lib/pointer'
import { AuthView } from '@/lib/types'
import { cn, isValidUsername } from '@/lib/utils'

export const LoginForm = ({
  errored,
  loggedOut,
  next,
  setErrored,
  setUsername,
  setView,
  username,
}: {
  errored: boolean
  loggedOut?: boolean
  next?: string | null
  setErrored: (errored: boolean) => void
  setUsername: (username?: string) => void
  setView: (view: AuthView) => void
  username?: string
}) => {
  const t = useTranslations('Auth')
  const [loading, setLoading] = useState(false)
  const [passwordReadOnly, setPasswordReadOnly] = useState(Boolean(loggedOut))
  useAutoFocus(username ? 'input[name="password"]' : 'input[name="username"]')

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
      .min(3, {
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
  const formDisabled = errored || loading

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

    const password = schema.password.trim()

    if (!PASSWORD_REGEX.test(password)) {
      setPasswordInvalid()
      setLoading(false)
      setErrored(true)
      return
    }

    const { error } = await login({ next, password, username: schema.username.trim() })
    setLoading(false)

    if (error.code === 'AUTH_ERROR') {
      setErrored(true)
      setPasswordInvalid()
      return
    }
    if (error.code === 'RATE_LIMITED') {
      toast.error(t('tooManyAttempts'))
      return
    }
    console.error(error)
    toast.error(t('networkError'))
  }

  useEffect(() => {
    if (!loggedOut) return
    const frame = requestAnimationFrame(() => {
      setPasswordReadOnly(false)
      form.setValue('password', '')
      if (username && finePointer()) form.setFocus('password')
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
    <Form {...form}>
      <form className="grid gap-5" method="post" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('userLabel')}</FormLabel>
              <FormControl>
                <Input autoCapitalize="none" autoComplete="username" autoCorrect="off" disabled={loading} {...field} />
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
              <div className="flex items-center justify-between gap-2">
                <FormLabel>{t('passwordLabel')}</FormLabel>
                <Button
                  className={cn('font-medium text-link', loading && 'pointer-events-none')}
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
                  autoComplete="current-password"
                  disabled={loading}
                  readOnly={passwordReadOnly}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="w-full [&_svg]:size-4"
          disabled={formDisabled}
          loading={loading}
          type="submit"
          variant="brand"
        >
          {loading ? t('loggingIn') : t('login')}
        </Button>
      </form>
    </Form>
  )
}
