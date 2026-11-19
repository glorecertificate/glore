'use client'

import { useRef } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { parseAsString, useQueryState } from 'nuqs'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { logout, updatePassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'
import { useFormErrored } from '@/hooks/use-form-disabled'
import { PASSWORD_REGEX } from '@/lib/constants'
import { AuthView } from '@/lib/types'

export const PasswordResetForm = ({
  resetToken,
  setErrored,
  setView,
}: {
  resetToken: string | null
  setErrored: (errored: boolean) => void
  setView: (view: AuthView) => void
}) => {
  const t = useTranslations('Auth')
  const [, setToken] = useQueryState('token', parseAsString)

  const formSchema = z.object({
    password: z
      .string()
      .nonempty(t('newPasswordRequired'))
      .min(8, {
        message: t('passwordTooShort'),
      })
      .regex(PASSWORD_REGEX, {
        message: t('passwordRequirements'),
      }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      password: '',
    },
    resolver: zodResolver(formSchema),
  })

  const errored = useFormErrored(form.control)
  const prevErrored = useRef(errored)

  if (prevErrored.current !== errored) {
    prevErrored.current = errored
    setErrored(errored)
  }

  const onSubmit = async (schema: z.infer<typeof formSchema>) => {
    if (!resetToken) {
      return setView('invalid_token')
    }

    const { error } = await updatePassword(resetToken, schema.password.trim())

    if (error) {
      if (error.code === 'INVALID_INPUT') {
        form.setError('password', { message: t('passwordRequirements') })
        form.setFocus('password')
        return
      }
      setView(error.code === 'INVALID_TOKEN' ? 'invalid_token' : 'invalid_password_reset')
      setToken(null)
      await logout()
      return
    }

    setView('password_updated')
    setToken(null)
    await logout()
  }

  return (
    <Form {...form}>
      <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('newPasswordLabel')}</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" autoFocus size="lg" {...field} />
              </FormControl>
              {form.formState.errors.password?.message !== t('passwordRequirements') && (
                <FormDescription>{t('passwordRequirements')}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="w-full [&_svg]:size-4"
          disabled={errored}
          loading={form.formState.isSubmitting}
          size="lg"
          type="submit"
          variant="brand"
        >
          {form.formState.isSubmitting ? t('savingPassword') : t('savePassword')}
        </Button>
      </form>
    </Form>
  )
}
