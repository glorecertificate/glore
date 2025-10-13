'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { type Enum } from '@glore/utils/types'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage, defaultFormDisabled } from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'
import { useApi } from '@/hooks/use-api'
import { useTranslations } from '@/hooks/use-translations'
import { PASSWORD_REGEX } from '@/lib/db'
import { type AuthView } from '@/lib/navigation'

export const PasswordResetForm = ({
  setEmail,
  setErrored,
  setView,
  token,
}: {
  setEmail: (email: string) => void
  setErrored: (hasErrors: boolean) => void
  setView: (view: Enum<AuthView>) => void
  token?: string | null
}) => {
  const api = useApi()
  const t = useTranslations('Auth')

  const formSchema = useMemo(
    () =>
      z.object({
        password: z
          .string()
          .nonempty(t('newPasswordRequired'))
          .min(8, {
            message: t('passwordTooShort'),
          })
          .regex(PASSWORD_REGEX, {
            message: t('passwordRequirements'),
          }),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
    },
  })

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      const password = schema.password.trim()

      try {
        if (!token) throw new Error()
        await api.auth.verify({ type: 'email', token_hash: token })
        const user = await api.auth.updateUser({ password })
        setEmail(user.email!)
      } catch (e) {
        console.error(e)
        setView('invalid_password_reset')
        return
      }

      setView('password_updated')
      await api.auth.logout()
    },
    [api.auth, setEmail, setView, token]
  )

  const hasErrors = Object.keys(form.formState.errors).length > 0

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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput autoFocus open placeholder={t('passwordLabel')} variant="floating" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            className="w-full [&_svg]:size-4"
            disabled={defaultFormDisabled(form)}
            disabledCursor
            disabledTitle={t('insertNewPassword')}
            loading={form.formState.isSubmitting}
            type="submit"
            variant="brand"
          >
            {form.formState.isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </form>
      </Form>
      <div className="mt-2 flex w-full justify-end">
        <Button onClick={() => setView('login')} size="text" variant="link">
          {t('skipAndLogin')}
        </Button>
      </div>
    </>
  )
}
