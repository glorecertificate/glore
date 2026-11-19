'use client'

import { useEffect, useRef } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { resetPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { useCookies } from '@/hooks/use-cookies'
import { AuthView } from '@/lib/types'
import { isValidUsername } from '@/lib/utils'

export const PasswordRequestForm = ({
  setErrored,
  setUsername,
  setView,
  username,
}: {
  setErrored: (hasErrors: boolean) => void
  setUsername: (name?: string) => void
  setView: (view: AuthView) => void
  username?: string
}) => {
  const t = useTranslations('Auth')
  const cookies = useCookies()
  const inputRef = useRef<HTMLInputElement>(null)

  const formSchema = z.object({
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
    },
    resolver: zodResolver(formSchema),
  })
  form.watch('username')

  const onSubmit = async (schema: z.infer<typeof formSchema>) => {
    const inputUsername = schema.username.trim()
    const { error } = await resetPassword(inputUsername)

    if (error?.code === 'RATE_LIMITED') {
      toast.error(t('tooManyAttempts'))
      return
    }
    if (error?.code === 'NOT_FOUND') {
      setErrored(true)
      form.setError('username', { message: t('userNotFound'), type: 'validate' }, { shouldFocus: true })
      return
    }
    if (error) {
      toast.error(t('networkError'))
      return
    }

    setView('email_sent')
    setUsername(inputUsername)
    cookies.set('loginUser', inputUsername)
  }

  useEffect(() => {
    const { unsubscribe } = form.watch(() => setErrored(false))
    return () => unsubscribe()
  }, [form, setErrored])

  return (
    <Form {...form}>
      <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit, () => setErrored(true))}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('userLabel')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoCapitalize="none"
                  autoComplete="username"
                  autoFocus
                  disabled={form.formState.isSubmitting}
                  size="lg"
                  ref={inputRef}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="w-full [&_svg]:size-4"
          loading={form.formState.isSubmitting}
          size="lg"
          type="submit"
          variant="brand"
        >
          {form.formState.isSubmitting ? t('sendingLink') : t('sendLink')}
        </Button>
      </form>
    </Form>
  )
}
