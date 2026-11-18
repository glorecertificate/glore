'use client'

import { useEffect, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { confirmAvatar, createAvatarUploadUrl, removeAvatar } from '@/actions/storage'
import { updateProfile } from '@/actions/user'
import { SettingsSection } from '@/components/features/users/settings-section'
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
import { CountrySelect } from '@/components/ui/country-select'
import { DatePicker } from '@/components/ui/date-picker'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SpokenLanguagesSelect } from '@/components/ui/spoken-languages-select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { useFormDisabled } from '@/hooks/use-form-disabled'
import { type Any } from '@/lib/types'
import i18nConfig from '~/config/i18n.json'

const FIELDS = ['firstName', 'lastName', 'bio', 'phone', 'birthday', 'sex', 'pronouns', 'city', 'country'] as const
const BIO_MAX = 1000
const PRONOUNS = ['she/her', 'he/him', 'they/them', 'ze/zir', 'other'] as const

export const ProfileForm = () => {
  const { user, setUser } = useSession()
  const t = useTranslations('Users')

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl)
  const [languages, setLanguages] = useState<string[]>(user.languages ?? [])
  const [removeAvatarOpen, setRemoveAvatarOpen] = useState(false)
  const returnFocus = useRef<HTMLElement | null>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const [removingAvatar, setRemovingAvatar] = useState(false)
  const focusFrame = useRef(0)

  useEffect(() => () => cancelAnimationFrame(focusFrame.current), [])

  const formSchema = z.object({
    firstName: z
      .string()
      .trim()
      .min(1, { message: t('firstNameRequired') })
      .max(100, { message: t('tooLong', { max: 100 }) }),
    lastName: z
      .string()
      .max(100, { message: t('tooLong', { max: 100 }) })
      .optional(),
    bio: z
      .string()
      .max(BIO_MAX, { message: t('tooLong', { max: BIO_MAX }) })
      .optional(),
    phone: z
      .string()
      .max(40, { message: t('tooLong', { max: 40 }) })
      .optional(),
    birthday: z.string().optional(),
    sex: z.enum(['female', 'male', 'non-binary', 'unspecified']).optional().or(z.literal('')),
    pronouns: z.string().optional(),
    city: z
      .string()
      .max(100, { message: t('tooLong', { max: 100 }) })
      .optional(),
    country: z.string().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onTouched',
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
  const formDisabled = useFormDisabled(form.control)

  const languagesChanged = (() => {
    const original = user.languages ?? []
    if (languages.length !== original.length) return true
    return languages.some(l => !original.includes(l))
  })()

  const disabled = formDisabled && !languagesChanged

  const handleAvatarUpload = async (file: File) => {
    try {
      const { key, url } = await createAvatarUploadUrl(file.type, file.size)
      const res = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      if (!res.ok) throw new Error('Upload failed')

      const { data, error } = await confirmAvatar(key)
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
  }

  const handleAvatarRemove = async () => {
    try {
      setRemovingAvatar(true)
      const { data, error } = await removeAvatar()
      if (error) {
        toast.error(t('profileUpdateError'))
        return
      }
      setAvatarPreview(null)
      if (data) setUser(data)
      toast.success(t('profileUpdated'))
      cancelAnimationFrame(focusFrame.current)
      focusFrame.current = requestAnimationFrame(() => {
        if (document.activeElement && document.activeElement !== document.body) return
        avatarRef.current?.querySelector('button')?.focus()
      })
    } catch {
      toast.error(t('profileUpdateError'))
    } finally {
      setRemovingAvatar(false)
    }
  }

  const onSubmit = async (schema: z.infer<typeof formSchema>) => {
    try {
      const updates: Parameters<typeof updateProfile>[0] = {}

      for (const key of FIELDS) {
        const value = schema[key]
        if (value !== (user[key] ?? '')) {
          updates[key] = (value || null) as never
        }
      }

      if (languagesChanged) {
        updates.languages = languages.length > 0 ? languages : null
      }

      if (Object.keys(updates).length > 0) {
        const data = await updateProfile(updates)
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
  }

  return (
    <Form {...form}>
      <form className="mx-auto w-full space-y-0" onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsSection description={t('profilePictureDescription')} title={t('profilePicture')}>
          <div ref={avatarRef}>
            <ImageCropper
              disabled={form.formState.isSubmitting}
              fallback={user.initials}
              onChange={handleAvatarUpload}
              onRemove={(event?: React.MouseEvent<HTMLElement>) => {
                returnFocus.current = event?.currentTarget ?? null
                setRemoveAvatarOpen(true)
              }}
              value={avatarPreview}
            />
          </div>
        </SettingsSection>

        <Separator className="mt-4 mb-8" />

        <div className="flex flex-col gap-8">
          {/* Personal information */}
          <SettingsSection description={t('personalInfoDescription')} title={t('personalInfo')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('firstName')}</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="given-name"
                        disabled={form.formState.isSubmitting}
                        placeholder={t('firstNamePlaceholder')}
                        {...field}
                      />
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
                      <Input
                        autoComplete="family-name"
                        disabled={form.formState.isSubmitting}
                        placeholder={t('lastNamePlaceholder')}
                        {...field}
                      />
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
                  <FormDescription className="text-right tabular-nums">
                    {t('bioCount', { count: field.value?.length ?? 0, max: BIO_MAX })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SettingsSection>
          {/* Personal details */}
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
                      onBlur={field.onBlur}
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
                      <PhoneInput
                        disabled={form.formState.isSubmitting}
                        onChange={field.onChange}
                        placeholder={t('phonePlaceholder')}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SettingsSection>
          {/* Location */}
          <SettingsSection description={t('locationDescription')} title={t('location')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('city')}</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="address-level2"
                        disabled={form.formState.isSubmitting}
                        placeholder={t('cityPlaceholder')}
                        {...field}
                      />
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
          {/* Languages */}
          <SettingsSection description={t('spokenLanguagesDescription')} title={t('spokenLanguages')}>
            <SpokenLanguagesSelect
              disabled={form.formState.isSubmitting}
              onChange={setLanguages}
              options={i18nConfig.spokenLanguages}
              value={languages}
            />
          </SettingsSection>
        </div>

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

        <AlertDialog onOpenChange={setRemoveAvatarOpen} open={removeAvatarOpen}>
          <AlertDialogContent
            onCloseAutoFocus={event => {
              event.preventDefault()
              const target = returnFocus.current?.isConnected
                ? returnFocus.current
                : avatarRef.current?.querySelector('button')
              target?.focus()
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{t('removeAvatarTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('removeAvatarDescription')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removingAvatar}>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction loading={removingAvatar} onClick={handleAvatarRemove} variant="destructive">
                {t('removeAvatar')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  )
}
