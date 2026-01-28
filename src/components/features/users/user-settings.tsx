'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { uploadAvatar } from '@/actions/storage'
import { updateUser } from '@/actions/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Input } from '@/components/ui/input'
import { LanguageSelect } from '@/components/ui/language-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type TableUpdate } from '@/db/types'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { type Any } from '@/lib/types'
import { defaultFormDisabled } from '@/lib/utils'

export const UserSettings = () => {
  const { user } = useSession()
  const { setLocale } = useI18n()
  const tGlobal = useTranslations()
  const t = useTranslations('Users')

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url)

  const formSchema = useMemo(
    () =>
      z.object({
        username: z
          .string()
          .min(3, { message: t('usernameInvalid') })
          .optional()
          .or(z.literal('')),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        birthday: z.string().optional(),
        sex: z.enum(['female', 'male', 'non-binary', 'unspecified']).optional().or(z.literal('')),
        pronouns: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        locale: z.enum(['en', 'es', 'it']).optional().or(z.literal('')),
        email: z.string().email().optional(), // Read only display usually
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      bio: user.bio || '',
      phone: user.phone || '',
      birthday: user.birthday || '',
      sex: user.sex || '',
      pronouns: user.pronouns || '',
      city: user.city || '',
      country: user.country || '',
      locale: user.locale || '',
      email: user.email || '',
    },
  })

  const disabled = defaultFormDisabled(form) && !avatarFile

  const generateUsername = useCallback((first_name: string, last_name: string) => {
    const parts = []
    if (first_name) parts.push(first_name.toLowerCase().replace(/\s+/g, ''))
    if (last_name) parts.push(last_name.toLowerCase().replace(/\s+/g, ''))
    return parts.join('.')
  }, [])

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'first_name' || name === 'last_name') {
        const username = generateUsername(value.first_name || '', value.last_name || '')
        if (username && !user.username) {
          form.setValue('username', username, { shouldValidate: false })
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, generateUsername, user.username])

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      try {
        const updates: TableUpdate<'users'> = {}
        const fields = [
          'username',
          'first_name',
          'last_name',
          'bio',
          'phone',
          'birthday',
          'sex',
          'pronouns',
          'city',
          'country',
          'locale',
        ] as const

        for (const key of fields) {
          if (schema[key] !== user[key]) {
            // @ts-expect-error key is valid
            updates[key] = schema[key] || null
          }
        }

        if (avatarFile) {
          const formData = new FormData()
          formData.append('file', avatarFile)
          const publicUrl = await uploadAvatar(formData)
          updates.avatar_url = publicUrl
        }

        if (Object.keys(updates).length > 0) {
          const data = await updateUser(user.id, updates)

          if (updates.locale && updates.locale !== user.locale) {
            setLocale(updates.locale as Any)
          }

          form.reset({
            username: data.username ?? '',
            first_name: data.first_name ?? '',
            last_name: data.last_name ?? '',
            bio: data.bio ?? '',
            phone: data.phone ?? '',
            birthday: data.birthday ?? '',
            sex: data.sex ?? '',
            pronouns: data.pronouns ?? '',
            city: data.city ?? '',
            country: data.country ?? '',
            locale: data.locale ?? '',
            email: data.email ?? '',
          })
          setAvatarFile(null)
          setAvatarPreview(data.avatar_url)
          toast.success(t('profileUpdated'))
        }
      } catch (error) {
        console.error(error)
        toast.error(t('profileUpdateError'))
      }
    },
    [form, t, user, avatarFile, setLocale]
  )

  const countries = useMemo(
    () => ['uk', 'us', 'it', 'fr', 'es', 'de', 'pt', 'cn', 'jp', 'ru', 'ar', 'br', 'ca', 'au', 'in', 'za', 'mx'],
    []
  )

  const translateCountry = useCallback(
    (country: string) => {
      const key = `Locale.Countries.${country}` as Any
      return tGlobal.has?.(key) ? tGlobal(key) : country.toUpperCase()
    },
    [tGlobal]
  )

  return (
    <Form {...form}>
      <form className="mx-auto max-w-5xl" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('personalInfo')}</CardTitle>
                <CardDescription>{'Manage your personal details.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('firstName')}</FormLabel>
                        <FormControl>
                          <Input
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
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('lastName')}</FormLabel>
                        <FormControl>
                          <Input
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

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('birthday')}</FormLabel>
                        <FormControl>
                          <Input disabled={form.formState.isSubmitting} type="date" {...field} />
                        </FormControl>
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
                        <Select
                          disabled={form.formState.isSubmitting}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="pronouns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pronouns')}</FormLabel>
                        <FormControl>
                          <Input
                            disabled={form.formState.isSubmitting}
                            placeholder={t('pronounsPlaceholder')}
                            {...field}
                          />
                        </FormControl>
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

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bio')}</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-32 resize-none"
                          disabled={form.formState.isSubmitting}
                          placeholder={t('bioPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('location')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                        <Select
                          disabled={form.formState.isSubmitting}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('countryPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map(country => (
                              <SelectItem key={country} value={country}>
                                {translateCountry(country)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('preferences')}</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                disabled={form.formState.isSubmitting}
                onClick={() => form.reset()}
                type="button"
                variant="outline"
              >
                {t('cancel')}
              </Button>
              <Button disabled={disabled} loading={form.formState.isSubmitting} type="submit" variant="brand">
                {t('saveChanges')}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{'Profile Picture'}</CardTitle>
                <CardDescription>{'Update your profile picture.'}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <ImageCropper
                  disabled={form.formState.isSubmitting}
                  onChange={file => {
                    setAvatarFile(file)
                    setAvatarPreview(URL.createObjectURL(file))
                  }}
                  onRemove={() => {
                    setAvatarFile(null)
                    setAvatarPreview(user.avatar_url)
                  }}
                  value={avatarPreview}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{'Account'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-muted" disabled readOnly />
                      </FormControl>
                      <FormDescription>{'Contact support to change email.'}</FormDescription>
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
                        <Input {...field} className="bg-muted/50" placeholder={t('usernamePlaceholder')} readOnly />
                      </FormControl>
                      <FormDescription>{'Username is auto-generated.'}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
