'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type Locale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { updateAccount } from '@/actions/user'
import { ImpersonationLockNote } from '@/components/features/admin/impersonation-lock-note'
import { SettingsSection } from '@/components/features/users/settings-section'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LanguageSelect } from '@/components/ui/language-select'
import { Separator } from '@/components/ui/separator'
import { StickySaveBar, useStickySaveBar } from '@/components/ui/sticky-save-bar'
import { toast } from '@/components/ui/toast'
import { type User } from '@/db/queries/user'
import { useActionError } from '@/hooks/use-action-error'
import { USERNAME_REGEX } from '@/lib/constants'
import { LOCALES } from '@/lib/i18n'
import { type Any } from '@/lib/types'
import { isReservedUsername } from '@/lib/username'

const defaults = (source: Pick<User, 'email' | 'locale' | 'username'>) => ({
  email: source.email ?? '',
  locale: (source.locale ?? '') as '' | Locale,
  username: source.username ?? '',
})

export const AccountForm = () => {
  const { impersonating, user, setUser } = useSession()
  const { setLocale } = useI18n()
  const t = useTranslations('Users')
  const actionError = useActionError()

  const accountSchema = z.object({
    email: z.email({ message: t('emailInvalid') }),
    locale: z.enum(LOCALES).optional().or(z.literal('')),
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
    mode: 'onTouched',
    resolver: zodResolver(accountSchema),
  })

  const saveBar = useStickySaveBar(form)

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
        <SettingsSection title={t('preferences')}>
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

        <SettingsSection title={t('account')}>
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

        <StickySaveBar count={saveBar.count} onDiscard={saveBar.discard} saving={saveBar.saving} />
      </form>
    </Form>
  )
}
