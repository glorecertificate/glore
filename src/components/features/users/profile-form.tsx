'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { confirmAvatar, createAvatarUploadUrl, removeAvatar } from '@/actions/storage'
import { updateUser } from '@/actions/user'
import { SettingsSection } from '@/components/features/users/settings-section'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { CountrySelect } from '@/components/ui/country-select'
import { DatePicker } from '@/components/ui/date-picker'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SpokenLanguagesSelect } from '@/components/ui/spoken-languages-select'
import { Textarea } from '@/components/ui/textarea'
import { type TableUpdate } from '@/db/types'
import { type Any } from '@/lib/types'
import { defaultFormDisabled } from '@/lib/utils'
import i18nConfig from '~/config/i18n.json'

const PRONOUNS = ['she/her', 'he/him', 'they/them', 'ze/zir', 'other'] as const

export const ProfileForm = () => {
  const { user, setUser } = useSession()
  const t = useTranslations('Users')

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl)
  const [languages, setLanguages] = useState<string[]>(user.languages ?? [])

  const formSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    bio: z.string().optional(),
    phone: z.string().optional(),
    birthday: z.string().optional(),
    sex: z.enum(['female', 'male', 'non-binary', 'unspecified']).optional().or(z.literal('')),
    pronouns: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  })

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

  const languagesChanged = (() => {
    const original = user.languages ?? []
    if (languages.length !== original.length) return true
    return languages.some(l => !original.includes(l))
  })()

  const disabled = defaultFormDisabled(form) && !languagesChanged

  const handleAvatarUpload = async (file: File) => {
    try {
      const { key, url } = await createAvatarUploadUrl(file.type)
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
  }

  const onSubmit = async (schema: z.infer<typeof formSchema>) => {
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
  }

  return (
    <Form {...form}>
      <form className="mx-auto w-full space-y-0" onSubmit={form.handleSubmit(onSubmit)}>
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
          <SpokenLanguagesSelect
            disabled={form.formState.isSubmitting}
            onChange={setLanguages}
            options={i18nConfig.spokenLanguages}
            value={languages}
          />
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
