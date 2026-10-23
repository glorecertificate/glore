'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { changePassword } from '@/actions/auth'
import { SettingsSection } from '@/components/features/users/settings-section'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'
import { useActionError } from '@/hooks/use-action-error'
import { PASSWORD_REGEX } from '@/lib/constants'

export const PasswordForm = () => {
  const t = useTranslations('Users')
  const actionError = useActionError()
  const { impersonating: locked } = useSession()

  const schema = z
    .object({
      confirmPassword: z.string().min(1, { message: t('confirmPasswordRequired') }),
      currentPassword: z.string().min(1, { message: t('currentPasswordRequired') }),
      newPassword: z
        .string()
        .min(8, { message: t('passwordTooShort') })
        .regex(PASSWORD_REGEX, { message: t('passwordRequirements') }),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    })

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: { confirmPassword: '', currentPassword: '', newPassword: '' },
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const result = await changePassword(values.currentPassword, values.newPassword)

      if (result.error) {
        if (result.error.code === 'INVALID_PASSWORD') {
          form.setError('currentPassword', { message: t('currentPasswordIncorrect') })
          return
        }
        toast.error(actionError(result.error, t('passwordChangeError')))
        return
      }

      form.reset()
      toast.success(t('passwordChanged'))
    } catch {
      toast.error(t('passwordChangeError'))
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-0" onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsSection description={t('securityDescription')} title={t('changePassword')}>
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('currentPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password"
                    disabled={locked || form.formState.isSubmitting}
                    placeholder={t('currentPasswordPlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('newPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    disabled={locked || form.formState.isSubmitting}
                    placeholder={t('newPasswordPlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t('passwordRequirements')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('confirmPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    disabled={locked || form.formState.isSubmitting}
                    placeholder={t('confirmPasswordPlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button
              disabled={locked || !form.formState.isDirty || form.formState.isSubmitting}
              loading={form.formState.isSubmitting}
              type="submit"
              variant="brand"
            >
              {t('updatePassword')}
            </Button>
          </div>
        </SettingsSection>
      </form>
    </Form>
  )
}
