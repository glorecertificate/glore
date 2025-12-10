'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import type { PostgrestError } from '@supabase/supabase-js'
import { useTranslations } from 'next-intl'
import { parseAsString, useQueryState } from 'nuqs'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { Enum } from '@glore/utils/types'

import type { AuthView } from '@/components/features/auth/types'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'
import { useCookies } from '@/hooks/use-cookies'
import { logout, updateAuthUser, verifyAuthUser } from '@/lib/actions/auth'
import { PASSWORD_REGEX } from '@/lib/constants'
import { isFormDisabled } from '@/lib/forms'

export const PasswordResetForm = ({
  setErrored,
  setView,
  token,
}: {
  setErrored: (hasErrors: boolean) => void
  setView: (view: Enum<AuthView>) => void
  token?: string | null
}) => {
  const [, setResetToken] = useQueryState('resetToken', parseAsString)
  const cookies = useCookies()
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
        await verifyAuthUser({ type: 'email', token_hash: token })
        await updateAuthUser({ password })
        setView('password_updated')
        setResetToken(null)
      } catch (e) {
        const error = e as PostgrestError
        if (error.code === 'same_password') {
          form.setError('password', { message: t('passwordSameAsOld') })
          return form.setFocus('password')
        }
        setView('invalid_password_reset')
        cookies.delete('user')
        setResetToken(null)
        return
      } finally {
        await logout()
      }
    },
    [cookies.delete, form, setResetToken, setView, t, token]
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
                    <PasswordInput autoFocus open variant="floating" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            className="w-full [&_svg]:size-4"
            disabled={isFormDisabled(form)}
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
