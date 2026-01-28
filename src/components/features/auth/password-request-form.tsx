'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { resetPassword } from '@/actions/auth'
import { findUserEmail } from '@/actions/user'
import { type AuthView } from '@/components/features/auth/auth-flow'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCookies } from '@/hooks/use-cookies'
import { type Enum } from '@/lib/types'
import { cn, defaultFormDisabled, isValidUsername } from '@/lib/utils'

export const PasswordRequestForm = ({
  setErrored,
  setUsername,
  setView,
  username,
}: {
  setErrored: (hasErrors: boolean) => void
  setUsername: (name?: string) => void
  setView: (view: Enum<AuthView>) => void
  username?: string
}) => {
  const cookies = useCookies()
  const t = useTranslations('Auth')

  const formSchema = useMemo(
    () =>
      z.object({
        username: z
          .string()
          .nonempty(t('userRequired'))
          .nonempty(t('userRequired'))
          .min(5, {
            message: t('userTooShort'),
          })
          .refine(isValidUsername, {
            message: t('userInvalid'),
          }),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: username ?? '',
    },
  })

  const disabled = defaultFormDisabled(form)

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      const username = schema.username.trim()
      const { data, error: emailError } = await findUserEmail(username)

      if (emailError) {
        emailError.code === 'PGRST116'
          ? form.setError('username', { message: t('userNotFound') }, { shouldFocus: true })
          : toast.error(t('networkError'))
        return
      }

      const { error } = await resetPassword(data.email, { redirectTo: window.location.origin })
      if (error) {
        toast.error(t('networkError'))
        console.error('Reset password error:', error)
        return
      }

      setView('email_sent')
      setUsername(username)
      cookies.set('loginUser', username)
    },
    [form, setUsername, setView, t, cookies.set]
  )

  const hasErrors = Object.keys(form.formState.errors).length > 0

  const backToLogin = useCallback(() => {
    setUsername(form.getValues('username'))
    setView('login')
  }, [form, setUsername, setView])

  useEffect(() => {
    setErrored(hasErrors)
  }, [hasErrors, setErrored])

  return (
    <>
      <Form {...form}>
        <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      autoFocus
                      disabled={form.formState.isSubmitting}
                      open
                      placeholder={t('userLabel')}
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
            disabled={!username && disabled}
            disabledTitle={t('userRequired')}
            loading={form.formState.isSubmitting}
            type="submit"
            variant="brand"
          >
            {form.formState.isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </form>
      </Form>
      <div className="mt-2 flex w-full justify-end">
        <Button
          className={cn(form.formState.isSubmitting && 'pointer-events-none')}
          disabled={form.formState.isSubmitting}
          onClick={backToLogin}
          size="text"
          variant="link"
        >
          {t('backToLogin')}
        </Button>
      </div>
    </>
  )
}
