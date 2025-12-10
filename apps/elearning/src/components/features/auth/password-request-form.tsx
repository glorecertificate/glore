'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import type { Enum } from '@glore/utils/types'

import type { AuthView } from '@/components/features/auth/types'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCookies } from '@/hooks/use-cookies'
import { requestPasswordReset } from '@/lib/actions/auth'
import { findUserEmail } from '@/lib/actions/user'
import type { SupabaseError } from '@/lib/db/utils'
import { isFormDisabled, isValidUsername } from '@/lib/forms'
import { cn } from '@/lib/utils'

export const PasswordRequestForm = ({
  defaultUsername,
  setErrored,
  setUsername,
  setView,
}: {
  defaultUsername?: string
  setErrored: (hasErrors: boolean) => void
  setUsername: (name?: string) => void
  setView: (view: Enum<AuthView>) => void
}) => {
  const cookies = useCookies()
  const locale = useLocale()
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
      username: defaultUsername ?? '',
    },
  })

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      const username = schema.username.trim()
      let email: string

      try {
        email = await findUserEmail(username)
      } catch (e) {
        const error = e as SupabaseError
        if (error.code === 'PGRST116')
          return form.setError('username', { message: t('userNotFound') }, { shouldFocus: true })
        return toast.error(t('networkError'))
      }

      try {
        await requestPasswordReset(email, locale)
      } catch (e) {
        const error = e as SupabaseError
        console.error(error.message)
        return toast.error(t('networkError'))
      }

      setView('email_sent')
      cookies.set('login_user', username)
    },
    [cookies, form, locale, setView, t]
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
            disabled={!defaultUsername && isFormDisabled(form)}
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
