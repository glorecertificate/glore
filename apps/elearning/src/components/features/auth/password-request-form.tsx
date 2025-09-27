'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { type PostgrestError } from '@supabase/supabase-js'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useLocale, useTranslations } from '@repo/i18n'
import { Button } from '@repo/ui/components/button'
import { defaultFormDisabled, Form, FormControl, FormField, FormItem, FormMessage } from '@repo/ui/components/form'
import { Input } from '@repo/ui/components/input'
import { cn } from '@repo/ui/utils'
import { log } from '@repo/utils/logger'
import { type Enum } from '@repo/utils/types'

import { useApi } from '@/hooks/use-api'
import { type User } from '@/lib/api'
import { type AuthView } from '@/lib/navigation'

export const PasswordRequestForm = ({
  setEmail,
  setErrored,
  setView,
}: {
  setEmail: (email: string) => void
  setErrored: (hasErrors: boolean) => void
  setView: (view: Enum<AuthView>) => void
}) => {
  const api = useApi()
  const { locale } = useLocale()
  const t = useTranslations('Auth')

  const formSchema = useMemo(
    () =>
      z.object({
        user: z
          .string()
          .nonempty(t('userRequired'))
          .min(5, {
            message: t('userInvalid'),
          }),
      }),
    [t],
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user: '',
    },
  })

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      let user: User
      const username = schema.user.trim()

      try {
        user = await api.users.findByUsername(username)
      } catch (e) {
        const error = e as PostgrestError
        if (error.code === 'PGRST116') return form.setError('user', { message: t('userNotFound') })
        log.error(e)
        return toast.error(t('networkError'))
      }

      try {
        await api.auth.resetPassword(user.email, { redirectTo: '/', locale })
      } catch (e) {
        log.error(e)
        return toast.error(t('networkError'))
      }

      setEmail(user.email)
      setView('email_sent')
    },
    [api.auth, api.users, form, locale, setEmail, setView, t],
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
              name="user"
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
            disabled={defaultFormDisabled(form)}
            disabledCursor
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
          onClick={() => setView('login')}
          size="text"
          variant="link"
        >
          {t('backToLogin')}
        </Button>
      </div>
    </>
  )
}
