'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { changePassword } from '@/actions/auth'
import { deleteAccount, updateUser } from '@/actions/user'
import { SettingsSection } from '@/components/features/users/settings-section'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LanguageSelect } from '@/components/ui/language-select'
import { PasswordInput } from '@/components/ui/password-input'
import { Separator } from '@/components/ui/separator'
import { type TableUpdate } from '@/db/types'
import { PASSWORD_REGEX } from '@/lib/constants'
import { type Any } from '@/lib/types'
import { defaultFormDisabled } from '@/lib/utils'

export const AccountForm = () => {
  const { user, setUser } = useSession()
  const { setLocale } = useI18n()
  const t = useTranslations('Users')

  const accountSchema = z.object({
    locale: z.enum(['en', 'es', 'it']).optional().or(z.literal('')),
    email: z.email().optional(),
    username: z
      .string()
      .min(3, { message: t('usernameInvalid') })
      .optional()
      .or(z.literal('')),
  })

  const accountForm = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      locale: (user.locale ?? '') as '' | 'en' | 'es' | 'it',
      email: user.email ?? '',
      username: user.username ?? '',
    },
  })

  useEffect(() => {
    if (!user.username && user.firstName) {
      const parts = []
      if (user.firstName) parts.push(user.firstName.toLowerCase().replace(/\s+/gu, ''))
      if (user.lastName) parts.push(user.lastName.toLowerCase().replace(/\s+/gu, ''))
      const username = parts.join('.')
      if (username) accountForm.setValue('username', username, { shouldValidate: false })
    }
  }, [accountForm, user.firstName, user.lastName, user.username])

  const accountDisabled = defaultFormDisabled(accountForm)

  const onAccountSubmit = async (schema: z.infer<typeof accountSchema>) => {
    try {
      const updates: TableUpdate<'users'> = {}
      const fields = ['locale', 'email', 'username'] as const

      for (const key of fields) {
        const value = schema[key]
        if (value !== (user[key] ?? '')) {
          updates[key] = (value || null) as never
        }
      }

      if (Object.keys(updates).length > 0) {
        const previousEmail = updates.email && updates.email !== user.email ? user.email : undefined
        const data = await updateUser(user.id, updates, previousEmail ?? undefined)

        if (updates.locale && updates.locale !== user.locale) {
          setLocale(updates.locale as Any)
        }

        setUser(data)
        accountForm.reset({
          locale: (data.locale ?? '') as '' | 'en' | 'es' | 'it',
          email: data.email ?? '',
          username: data.username ?? '',
        })
        toast.success(t('accountUpdated'))
      }
    } catch (error) {
      console.error(error)
      toast.error(t('accountUpdateError'))
    }
  }

  const passwordSchema = z
    .object({
      currentPassword: z.string().min(1, { message: t('currentPasswordRequired') }),
      newPassword: z
        .string()
        .min(8, { message: t('passwordTooShort') })
        .regex(PASSWORD_REGEX, { message: t('passwordRequirements') }),
      confirmPassword: z.string().min(1, { message: t('confirmPasswordRequired') }),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    try {
      const result = await changePassword(values.currentPassword, values.newPassword)

      if (result.error) {
        if (result.error.message?.includes('Invalid login')) {
          passwordForm.setError('currentPassword', { message: t('currentPasswordIncorrect') })
        } else {
          toast.error(t('passwordChangeError'))
        }
        return
      }

      passwordForm.reset()
      toast.success(t('passwordChanged'))
    } catch {
      toast.error(t('passwordChangeError'))
    }
  }

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'SOLE_ORG_ADMIN') {
        toast.error(t('deleteAccountBlockedAdmin'))
      } else if (message === 'HAS_CERTIFICATES') {
        toast.error(t('deleteAccountBlockedCerts'))
      } else {
        toast.error(t('deleteAccountError'))
      }
      setDeleteAccountOpen(false)
    }
  }

  return (
    <div className="mx-auto w-full space-y-0">
      <Form {...accountForm}>
        <form className="space-y-0" onSubmit={accountForm.handleSubmit(onAccountSubmit)}>
          <SettingsSection description={t('preferencesDescription')} title={t('preferences')}>
            <FormField
              control={accountForm.control}
              name="locale"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>{t('locale')}</FormLabel>
                  <FormControl>
                    <LanguageSelect
                      controlled
                      disabled={accountForm.formState.isSubmitting}
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
            <FormField
              control={accountForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={accountForm.formState.isSubmitting} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={accountForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('username')}</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-muted/50" placeholder={t('usernamePlaceholder')} readOnly />
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
              disabled={accountDisabled || accountForm.formState.isSubmitting}
              onClick={() => accountForm.reset()}
              type="button"
              variant="outline"
            >
              {t('reset')}
            </Button>
            <Button
              disabled={accountDisabled}
              loading={accountForm.formState.isSubmitting}
              type="submit"
              variant="brand"
            >
              {t('saveChanges')}
            </Button>
          </div>
        </form>
      </Form>

      <Separator className="my-10" />

      <Form {...passwordForm}>
        <form className="space-y-0" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
          <SettingsSection description={t('securityDescription')} title={t('changePassword')}>
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('currentPassword')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      disabled={passwordForm.formState.isSubmitting}
                      placeholder={t('currentPasswordPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('newPassword')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      disabled={passwordForm.formState.isSubmitting}
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
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('confirmPassword')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      disabled={passwordForm.formState.isSubmitting}
                      placeholder={t('confirmPasswordPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SettingsSection>

          <Separator className="my-8" />

          <div className="flex justify-end">
            <Button
              disabled={!passwordForm.formState.isDirty || passwordForm.formState.isSubmitting}
              loading={passwordForm.formState.isSubmitting}
              type="submit"
              variant="brand"
            >
              {t('updatePassword')}
            </Button>
          </div>
        </form>
      </Form>

      <Separator className="my-10" />

      <SettingsSection description={t('dangerZoneDescription')} title={t('dangerZone')}>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">{t('deleteAccountTitle')}</CardTitle>
            <CardDescription>{t('deleteAccountDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setDeleteAccountOpen(true)} type="button" variant="destructive">
              {t('deleteAccount')}
            </Button>
          </CardContent>
        </Card>
      </SettingsSection>

      <AccountDeleteDialog
        onConfirm={handleDeleteAccount}
        onOpenChange={setDeleteAccountOpen}
        open={deleteAccountOpen}
      />
    </div>
  )
}

const AccountDeleteDialog = ({
  onConfirm,
  onOpenChange,
  open,
}: {
  onConfirm: () => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
}) => {
  const t = useTranslations('Users')
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    try {
      setDeleting(true)
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteAccountConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteAccountConfirmDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            loading={deleting}
            loadingText={t('deleting')}
            onClick={handleConfirm}
            variant="destructive"
          >
            {t('deleteAccount')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
