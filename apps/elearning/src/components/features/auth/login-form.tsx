'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { type Enum } from '@glore/utils/types'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { defaultFormDisabled, Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Link } from '@/components/ui/link'
import { PasswordInput } from '@/components/ui/password-input'
import { DatabaseError, findUserEmail, login, PASSWORD_REGEX } from '@/lib/data'
import { type AuthView, buildExternalRoute, redirect } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const LoginForm = ({
  defaultEmail,
  setErrored,
  setView,
}: {
  defaultEmail: string | null
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
        password: z
          .string()
          .nonempty(t('passwordRequired'))
          .min(8, {
            message: t('passwordTooShort'),
          }),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user: defaultEmail ?? '',
      password: '',
    },
  })

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      const username = schema.user.trim()
      const password = schema.password.trim()
      let email: string

      try {
        email = await findUserEmail(username)
      } catch (e) {
        const error = e as DatabaseError
        if (error.code === 'PGRST116') {
          form.setError('user', { message: t('userNotFound') })
          return form.setFocus('user')
        }
        console.error(e)
        return toast.error(t('networkError'))
      }

      try {
        if (!PASSWORD_REGEX.test(password)) throw new DatabaseError({ code: '28P01' })
        await login({ email, password })
      } catch (e) {
        const error = e as DatabaseError
        if (error.code === 'PGRST116' || error.code === '28P01') {
          form.setError('password', { message: t('passwordInvalid') })
          form.setFocus('password')
          return
        }
        console.error(e)
        return toast.error(t('networkError'))
      }

      redirect('/')
    },
    [form, t]
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
                      className={cn('text-foreground/95', form.formState.isSubmitting && 'pointer-events-none')}
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
        <div className="mt-2 text-center text-muted-foreground text-sm">
          {t.rich('signupMessage', {
            link: content => (
              <DialogTrigger asChild>
                <Button
                  className={cn('text-foreground/95', form.formState.isSubmitting && 'pointer-events-none')}
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
                <Link className="font-medium" href={buildExternalRoute('www')} underline>
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
