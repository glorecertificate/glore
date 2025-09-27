'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { type PostgrestError } from '@supabase/supabase-js'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useTranslations } from '@repo/i18n'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog'
import { defaultFormDisabled, Form, FormControl, FormField, FormItem, FormMessage } from '@repo/ui/components/form'
import { Input } from '@repo/ui/components/input'
import { PasswordInput } from '@repo/ui/components/password-input'
import { cn } from '@repo/ui/utils'
import { log } from '@repo/utils/logger'
import { type Enum } from '@repo/utils/types'

import { Link } from '@/components/ui/link'
import { useApi } from '@/hooks/use-api'
import { PASSWORD_REGEX, type User } from '@/lib/api'
import { DatabaseError } from '@/lib/db'
import { redirect, route, type AuthView } from '@/lib/navigation'

export const LoginForm = ({
  setErrored,
  setView,
}: {
  setErrored: (hasErrors: boolean) => void
  setView: (view: Enum<AuthView>) => void
}) => {
  const api = useApi()
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
        password: z
          .string()
          .nonempty(t('passwordRequired'))
          .min(8, {
            message: t('passwordTooShort'),
          }),
      }),
    [t],
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user: '',
      password: '',
    },
  })

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      let user: User
      const username = schema.user.trim()
      const password = schema.password.trim()

      try {
        user = await api.users.findByUsername(username)
      } catch (e) {
        const error = e as PostgrestError
        if (error.code === 'PGRST116') {
          form.setError('user', { message: t('userNotFound') })
          form.setFocus('user')
          return
        }
        log.error(e)
        return toast.error(t('networkError'))
      }

      try {
        if (!PASSWORD_REGEX.test(password)) throw new DatabaseError('invalid_credentials')
        await api.auth.login({ email: user.email, password })
      } catch (e) {
        const error = e as DatabaseError
        if (error.code === 'PGRST116' || error.code === 'invalid_credentials') {
          form.setError('password', { message: t('passwordInvalid') })
          form.setFocus('password')
          return
        }
        log.error(e)
        return toast.error(t('networkError'))
      }

      redirect('/')
    },
    [api, form, t],
  )

  const hasErrors = Object.keys(form.formState.errors).length > 0

  useEffect(() => {
    setErrored(hasErrors)
  }, [hasErrors, setErrored])

  return (
    <>
      <Form {...form}>
        <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      autoFocus
                      defaultOpen
                      disabled={form.formState.isSubmitting}
                      placeholder={t('userLabel')}
                      variant="floating"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="gap-1">
                  <div className="flex w-full justify-end">
                    <Button
                      className={cn(
                        'text-[13px] text-foreground/95',
                        form.formState.isSubmitting && 'pointer-events-none',
                      )}
                      disabled={form.formState.isSubmitting}
                      onClick={() => setView('password_request')}
                      size="text"
                      type="button"
                      variant="link"
                    >
                      {t('forgotPassword')}
                    </Button>
                  </div>
                  <FormControl>
                    <PasswordInput
                      disabled={form.formState.isSubmitting}
                      placeholder={t('passwordLabel')}
                      srHide={t('hidePassword')}
                      srShow={t('showPassword')}
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
            disabledTitle={t('insertCredentials')}
            loading={form.formState.isSubmitting}
            type="submit"
            variant="brand"
          >
            {form.formState.isSubmitting ? t('loggingIn') : t('login')}
          </Button>
        </form>
      </Form>
      <Dialog>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          {t.rich('signupMessage', {
            link: content => (
              <DialogTrigger asChild>
                <Button
                  className={cn('text-[13px] text-foreground/95', form.formState.isSubmitting && 'pointer-events-none')}
                  disabled={form.formState.isSubmitting}
                  size="text"
                  type="button"
                  variant="link"
                >
                  {content}
                </Button>
              </DialogTrigger>
            ),
          })}
        </div>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-left text-xl">{t('signupDialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {t.rich('signupDialogMessage', {
              p: content => <p>{content}</p>,
              b: content => <span className="font-medium">{content}</span>,
              link: content => (
                <Link className="font-medium" href={route.extenal('www')} underline>
                  {content}
                </Link>
              ),
            })}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('close')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
