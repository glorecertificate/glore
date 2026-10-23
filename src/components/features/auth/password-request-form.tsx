'use client'

import { useRef } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { resetPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCookies } from '@/hooks/use-cookies'
import { useFormDisabled } from '@/hooks/use-form-disabled'
import { AuthView } from '@/lib/types'
import { cn, isValidUsername } from '@/lib/utils'

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
  const formDisabled = useFormDisabled(form.control)
  form.watch('username')

  const onSubmit = async (schema: z.infer<typeof formSchema>) => {
    const inputUsername = schema.username.trim()
    const { error } = await resetPassword(inputUsername)

    if (error?.code === 'RATE_LIMITED') {
      toast.error(t('tooManyAttempts'))
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

  const hasErrors = Object.keys(form.formState.errors).length > 0
  const prevHasErrors = useRef(hasErrors)

  if (prevHasErrors.current !== hasErrors) {
    prevHasErrors.current = hasErrors
    setErrored(hasErrors)
  }

  const backToLogin = () => {
    setView('login')
    setUsername('')
  }

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
                      {...field}
                      autoFocus
                      disabled={form.formState.isSubmitting}
                      open
                      placeholder={t('userLabel')}
                      variant="floating"
                      ref={inputRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            className="w-full [&_svg]:size-4"
            disabled={!username && formDisabled}
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
