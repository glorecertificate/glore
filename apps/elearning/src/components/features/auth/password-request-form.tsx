'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { type Enum } from '@glore/utils/types'

import { Button } from '@/components/ui/button'
import { defaultFormDisabled, Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type DatabaseError, findUserEmail, resetPassword } from '@/lib/data'
import { type AuthView } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const PasswordRequestForm = ({
  defaultEmail,
  setEmail,
  setErrored,
  setView,
}: {
  defaultEmail?: string
  setEmail: (email: string) => void
  setErrored: (hasErrors: boolean) => void
  setView: (view: Enum<AuthView>) => void
}) => {
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
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user: defaultEmail ?? '',
    },
  })

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      const username = schema.user.trim()
      let email: string

      try {
        email = await findUserEmail(username)
      } catch (e) {
        const error = e as DatabaseError
        if (error.code === 'PGRST116')
          return form.setError('user', { message: t('userNotFound') }, { shouldFocus: true })
        return toast.error(t('networkError'))
      }

      try {
        await resetPassword(email)
      } catch (e) {
        const error = e as DatabaseError
        console.error(error.message)
        return toast.error(t('networkError'))
      }

      setEmail(email)
      setView('email_sent')
    },
    [form, setEmail, setView, t]
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
            disabled={!defaultEmail && defaultFormDisabled(form)}
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
