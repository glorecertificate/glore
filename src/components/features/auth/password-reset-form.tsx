'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { parseAsString, useQueryState } from 'nuqs'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { logout, updatePassword } from '@/actions/auth'
import { type AuthView } from '@/components/features/auth/auth-flow'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'
import { PASSWORD_REGEX } from '@/lib/constants'
import { type Enum } from '@/lib/types'
import { defaultFormDisabled } from '@/lib/utils'

export const PasswordResetForm = ({
  resetToken,
  setErrored,
  setView,
}: {
  resetToken: string | null
  setErrored: (errored: boolean) => void
  setView: (view: Enum<AuthView>) => void
}) => {
  const t = useTranslations('Auth')
  const [, setToken] = useQueryState('resetToken', parseAsString)

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

  const disabled = defaultFormDisabled(form)
  const errored = Object.keys(form.formState.errors).length > 0

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      if (!resetToken) return setView('invalid_token')

      const { error } = await updatePassword(resetToken, schema.password.trim())

      if (error) {
        if (error.code === 'same_password') {
          form.setError('password', { message: t('passwordSameAsOld') })
          form.setFocus('password')
          return
        }
        setView('invalid_password_reset')
        setToken(null)
        await logout()
        return
      }

      setView('password_updated')
      setToken(null)
      await logout()
    },
    [form, setToken, setView, t, resetToken]
  )

  useEffect(() => {
    setErrored(errored)
  }, [errored, setErrored])

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
            disabled={disabled}
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
        <Button
          onClick={() => {
            setToken(null)
            setView('login')
          }}
          size="text"
          variant="link"
        >
          {t('skipAndLogin')}
        </Button>
      </div>
    </>
  )
}
