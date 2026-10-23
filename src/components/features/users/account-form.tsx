'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type Locale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { updateAccount } from '@/actions/user'
import { ImpersonationLockNote } from '@/components/features/admin/impersonation-lock-note'
import { SettingsSection } from '@/components/features/users/settings-section'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LanguageSelect } from '@/components/ui/language-select'
import { Separator } from '@/components/ui/separator'
import { type User } from '@/db/queries/user'
import { useActionError } from '@/hooks/use-action-error'
import { USERNAME_REGEX } from '@/lib/constants'
import { type Any } from '@/lib/types'
import { isReservedUsername } from '@/lib/username'
import { defaultFormDisabled } from '@/lib/utils'

const defaults = (source: Pick<User, 'email' | 'locale' | 'username'>) => ({
  email: source.email ?? '',
  locale: (source.locale ?? '') as '' | 'en' | 'es' | 'it',
  username: source.username ?? '',
})

export const AccountForm = () => {
  const { impersonating, user, setUser } = useSession()
  const { setLocale } = useI18n()
  const t = useTranslations('Users')
  const actionError = useActionError()

  const accountSchema = z.object({
    email: z.email(),
    locale: z.enum(['en', 'es', 'it']).optional().or(z.literal('')),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, { message: t('usernameInvalid') })
      .max(40, { message: t('usernameInvalid') })
      .regex(USERNAME_REGEX, { message: t('usernameFormat') })
      .refine(value => !isReservedUsername(value), { message: t('usernameReserved') }),
  })

  const form = useForm<z.infer<typeof accountSchema>>({
    defaultValues: defaults(user),
    resolver: zodResolver(accountSchema),
  })

  const disabled = defaultFormDisabled(form)

  const onSubmit = async (values: z.infer<typeof accountSchema>) => {
    const updates: { email?: string; locale?: Locale | null; username?: string } = {}
    if (values.email !== user.email) updates.email = values.email
    if (values.locale !== (user.locale ?? '')) updates.locale = (values.locale || null) as Locale | null
    if (values.username !== (user.username ?? '')) updates.username = values.username
    if (Object.keys(updates).length === 0) return

    try {
      const result = await updateAccount(updates)
      if (result.error?.code === 'USERNAME_TAKEN') {
        form.setError('username', { message: t('usernameTaken') })
        return
      }
      if (result.error?.code === 'USERNAME_RESERVED') {
        form.setError('username', { message: t('usernameReserved') })
        return
      }
      if (result.error) {
        toast.error(actionError(result.error, t('accountUpdateError')))
        return
      }
      const { pendingEmail, user: data } = result

      if (updates.locale && updates.locale !== user.locale) setLocale(updates.locale)

      setUser(data)
      form.reset(defaults(data))
      toast.success(pendingEmail ? t('emailChangeRequested', { email: pendingEmail }) : t('accountUpdated'))
    } catch (error) {
      console.error(error)
      toast.error(t('accountUpdateError'))
    }
  }

  return (
    <Form {...form}>
      <form className="mx-auto w-full space-y-0" onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsSection description={t('preferencesDescription')} title={t('preferences')}>
          <FormField
            control={form.control}
            name="locale"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>{t('locale')}</FormLabel>
                <FormControl>
                  <LanguageSelect
                    controlled
                    disabled={form.formState.isSubmitting}
                    onChange={field.onChange}
                    value={field.value as Any}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingsSection>

        <Separator className="my-8" />

        <SettingsSection description={t('accountDescription')} title={t('account')}>
          <ImpersonationLockNote />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('email')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="email"
                    disabled={impersonating || form.formState.isSubmitting}
                    type="email"
                  />
                </FormControl>
                <FormDescription>{t('emailDescription')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('username')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoCapitalize="none"
                    autoComplete="username"
                    disabled={impersonating || form.formState.isSubmitting}
                    placeholder={t('usernamePlaceholder')}
                    spellCheck={false}
                  />
                </FormControl>
                <FormDescription>{t('usernameDescription')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingsSection>

        <Separator className="my-8" />

        <div className="flex justify-end gap-3">
          <Button
            disabled={disabled || form.formState.isSubmitting}
            onClick={() => form.reset()}
            type="button"
            variant="outline"
          >
            {t('reset')}
          </Button>
          <Button disabled={disabled} loading={form.formState.isSubmitting} type="submit" variant="brand">
            {t('saveChanges')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
