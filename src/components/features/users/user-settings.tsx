'use client'

import { type ReactNode, memo, useCallback, useEffect, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { changePassword } from '@/actions/auth'
import { removeAvatar, uploadAvatar } from '@/actions/storage'
import { deleteAccount, updateUser } from '@/actions/user'
import { useUserSettingsTab } from '@/components/features/users/user-settings-tabs'
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
import { CountrySelect } from '@/components/ui/country-select'
import { DatePicker } from '@/components/ui/date-picker'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Input } from '@/components/ui/input'
import { LanguageSelect } from '@/components/ui/language-select'
import { PasswordInput } from '@/components/ui/password-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Toggle } from '@/components/ui/toggle'
import { type TableUpdate } from '@/db/types'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { PASSWORD_REGEX } from '@/lib/constants'
import { type Any } from '@/lib/types'
import { cn, defaultFormDisabled } from '@/lib/utils'

const SPOKEN_LANGUAGES = [
  'en',
  'es',
  'it',
  'fr',
  'de',
  'pt',
  'ar',
  'ja',
  'ru',
  'zh',
  'ko',
  'hi',
  'tr',
  'nl',
  'pl',
  'sv',
  'da',
  'fi',
  'el',
  'he',
  'th',
  'vi',
  'id',
  'uk',
  'ro',
  'hu',
  'cs',
  'no',
  'bn',
  'sw',
  'fa',
  'ca',
  'ms',
] as const

const PRONOUNS = ['she/her', 'he/him', 'they/them', 'ze/zir', 'other'] as const

export const UserSettings = ({ sessionsContent }: { sessionsContent?: ReactNode }) => {
  const { tab } = useUserSettingsTab()

  if (tab === 'profile') return <ProfileForm />
  if (tab === 'account') return <AccountForm sessionsContent={sessionsContent} />
  return null
}

const SettingsSection = memo(
  ({
    children,
    description,
    title,
  }: React.ComponentProps<'div'> & {
    description: string
  }) => (
    <section className="grid gap-6 md:grid-cols-[minmax(200px,1fr)_2fr]">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
)

const ProfileForm = () => {
  const { user, setUser } = useSession()
  const tGlobal = useTranslations()
  const t = useTranslations('Users')

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl)
  const [languages, setLanguages] = useState<string[]>(user.languages ?? [])

  const formSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        birthday: z.string().optional(),
        sex: z.enum(['female', 'male', 'non-binary', 'unspecified']).optional().or(z.literal('')),
        pronouns: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
      }),
    []
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      bio: user.bio ?? '',
      phone: user.phone ?? '',
      birthday: user.birthday ?? '',
      sex: (user.sex ?? '') as '' | 'female' | 'male' | 'non-binary' | 'unspecified',
      pronouns: user.pronouns ?? '',
      city: user.city ?? '',
      country: user.country ?? '',
    },
  })

  const languagesChanged = useMemo(() => {
    const original = user.languages ?? []
    if (languages.length !== original.length) return true
    return languages.some(l => !original.includes(l))
  }, [languages, user.languages])

  const disabled = defaultFormDisabled(form) && !languagesChanged

  const handleAvatarUpload = useCallback(
    async (file: File) => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const { data, error } = await uploadAvatar(formData)
        if (error || !data) {
          toast.error(t('avatarUploadError'))
          return
        }
        setAvatarPreview(data.avatarUrl)
        setUser(data)
        toast.success(t('avatarUploaded'))
      } catch (e) {
        console.error(e)
        toast.error(t('avatarUploadError'))
      }
    },
    [t, setUser]
  )

  const handleAvatarRemove = useCallback(async () => {
    try {
      const { data, error } = await removeAvatar()
      if (error) {
        toast.error(t('profileUpdateError'))
        return
      }
      setAvatarPreview(null)
      if (data) setUser(data)
      toast.success(t('profileUpdated'))
    } catch {
      toast.error(t('profileUpdateError'))
    }
  }, [t, setUser])

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      try {
        const updates: TableUpdate<'users'> = {}
        const fields = [
          'firstName',
          'lastName',
          'bio',
          'phone',
          'birthday',
          'sex',
          'pronouns',
          'city',
          'country',
        ] as const

        for (const key of fields) {
          const value = schema[key]
          if (value !== (user[key] ?? '')) {
            updates[key] = (value || null) as never
          }
        }

        if (languagesChanged) {
          updates.languages = languages.length > 0 ? languages : null
        }

        if (Object.keys(updates).length > 0) {
          const data = await updateUser(user.id, updates)

          setUser(data)
          form.reset({
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
            bio: data.bio ?? '',
            phone: data.phone ?? '',
            birthday: data.birthday ?? '',
            sex: (data.sex ?? '') as '' | 'female' | 'male' | 'non-binary' | 'unspecified',
            pronouns: data.pronouns ?? '',
            city: data.city ?? '',
            country: data.country ?? '',
          })
          setLanguages(data.languages ?? [])
          toast.success(t('profileUpdated'))
        }
      } catch (error) {
        console.error(error)
        toast.error(t('profileUpdateError'))
      }
    },
    [form, t, user, languages, languagesChanged, setUser]
  )

  const translateLanguage = useCallback(
    (language: string) => {
      const key = `Intl.Languages.${language}` as Any
      return tGlobal.has?.(key) ? tGlobal(key) : language.toUpperCase()
    },
    [tGlobal]
  )

  const toggleLanguage = useCallback((lang: string) => {
    setLanguages(prev => (prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]))
  }, [])

  return (
    <Form {...form}>
      <form className="space-y-0" onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsSection description={t('profilePictureDescription')} title={t('profilePicture')}>
          <ImageCropper
            disabled={form.formState.isSubmitting}
            fallback={user.initials}
            onChange={handleAvatarUpload}
            onRemove={handleAvatarRemove}
            value={avatarPreview}
          />
        </SettingsSection>

        <Separator className="my-8" />

        <SettingsSection description={t('personalInfoDescription')} title={t('personalInfo')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('firstName')}</FormLabel>
                  <FormControl>
                    <Input disabled={form.formState.isSubmitting} placeholder={t('firstNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('lastName')}</FormLabel>
                  <FormControl>
                    <Input disabled={form.formState.isSubmitting} placeholder={t('lastNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('bio')}</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-24 resize-none"
                    disabled={form.formState.isSubmitting}
                    placeholder={t('bioPlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingsSection>

        <Separator className="my-8" />

        <SettingsSection description={t('personalDetailsDescription')} title={t('personalDetails')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('birthday')}</FormLabel>
                  <DatePicker
                    disabled={form.formState.isSubmitting}
                    onChange={field.onChange}
                    value={field.value ?? ''}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sex')}</FormLabel>
                  <Select disabled={form.formState.isSubmitting} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectSex')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="female">{t('female')}</SelectItem>
                      <SelectItem value="male">{t('male')}</SelectItem>
                      <SelectItem value="non-binary">{t('nonBinary')}</SelectItem>
                      <SelectItem value="unspecified">{t('unspecified')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="pronouns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pronouns')}</FormLabel>
                  <Select disabled={form.formState.isSubmitting} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectPronouns')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRONOUNS.map(p => (
                        <SelectItem key={p} value={p}>
                          {t(`pronouns_${p.replace('/', '')}` as Any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phone')}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={form.formState.isSubmitting}
                      placeholder={t('phonePlaceholder')}
                      type="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SettingsSection>

        <Separator className="my-8" />

        <SettingsSection description={t('locationDescription')} title={t('location')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('city')}</FormLabel>
                  <FormControl>
                    <Input disabled={form.formState.isSubmitting} placeholder={t('cityPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('country')}</FormLabel>
                  <CountrySelect
                    disabled={form.formState.isSubmitting}
                    onChange={field.onChange}
                    value={field.value ?? ''}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SettingsSection>

        <Separator className="my-8" />

        <SettingsSection description={t('spokenLanguagesDescription')} title={t('spokenLanguages')}>
          <div className="flex flex-wrap gap-2">
            {SPOKEN_LANGUAGES.map(lang => (
              <Toggle
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
                  'data-[state=off]:border-border data-[state=off]:bg-background data-[state=off]:text-muted-foreground data-[state=off]:hover:border-primary/40 data-[state=off]:hover:text-foreground'
                )}
                disabled={form.formState.isSubmitting}
                key={lang}
                onPressedChange={() => toggleLanguage(lang)}
                pressed={languages.includes(lang)}
              >
                {translateLanguage(lang)}
              </Toggle>
            ))}
          </div>
        </SettingsSection>

        <Separator className="my-8" />

        <div className="flex justify-end gap-3">
          <Button
            disabled={disabled || form.formState.isSubmitting}
            onClick={() => {
              form.reset()
              setLanguages(user.languages ?? [])
            }}
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

const AccountForm = ({ sessionsContent }: { sessionsContent?: ReactNode }) => {
  const { user, setUser } = useSession()
  const { setLocale } = useI18n()
  const t = useTranslations('Users')

  const accountSchema = useMemo(
    () =>
      z.object({
        locale: z.enum(['en', 'es', 'it']).optional().or(z.literal('')),
        email: z.email().optional(),
        username: z
          .string()
          .min(3, { message: t('usernameInvalid') })
          .optional()
          .or(z.literal('')),
      }),
    [t]
  )

  const accountForm = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      locale: (user.locale ?? '') as '' | 'en' | 'es' | 'it',
      email: user.email ?? '',
      username: user.username ?? '',
    },
  })

  const generateUsername = useCallback((firstName: string, lastName: string) => {
    const parts = []
    if (firstName) parts.push(firstName.toLowerCase().replace(/\s+/g, ''))
    if (lastName) parts.push(lastName.toLowerCase().replace(/\s+/g, ''))
    return parts.join('.')
  }, [])

  useEffect(() => {
    if (!user.username && user.firstName) {
      const username = generateUsername(user.firstName ?? '', user.lastName ?? '')
      if (username) accountForm.setValue('username', username, { shouldValidate: false })
    }
  }, [accountForm, generateUsername, user.username, user.firstName, user.lastName])

  const accountDisabled = defaultFormDisabled(accountForm)

  const onAccountSubmit = useCallback(
    async (schema: z.infer<typeof accountSchema>) => {
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
    },
    [accountForm, t, user, setLocale, setUser]
  )

  const passwordSchema = useMemo(
    () =>
      z
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
        }),
    [t]
  )

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onPasswordSubmit = useCallback(
    async (values: z.infer<typeof passwordSchema>) => {
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
    },
    [passwordForm, t]
  )

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

  const handleDeleteAccount = useCallback(async () => {
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
  }, [t])

  return (
    <div className="space-y-0">
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

      {sessionsContent && (
        <>
          <SettingsSection description={t('sessionsDescription')} title={t('sessions')}>
            {sessionsContent}
          </SettingsSection>

          <Separator className="my-10" />
        </>
      )}

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

  const handleConfirm = useCallback(async () => {
    try {
      setDeleting(true)
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }, [onConfirm])

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
