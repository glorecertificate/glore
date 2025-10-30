'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { type Any } from '@glore/utils/types'

import { Button } from '@/components/ui/button'
import {
  defaultFormDisabled,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useHeader } from '@/hooks/use-header'
import { useIntl } from '@/hooks/use-intl'
import { useSession } from '@/hooks/use-session'
import { updateUser } from '@/lib/data'

export const UserSettings = () => {
  const tGlobal = useTranslations()
  const t = useTranslations('Settings')
  const { user, setUser } = useSession()
  const { localeItems } = useIntl()

  useHeader({
    shadow: false,
  })

  const formSchema = useMemo(
    () =>
      z.object({
        username: z
          .string()
          .min(3, { message: t('usernameInvalid') })
          .optional()
          .or(z.literal('')),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        birthday: z.string().optional(),
        sex: z.enum(['female', 'male', 'non-binary', 'unspecified']).optional().or(z.literal('')),
        pronouns: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        locale: z.enum(['en', 'es', 'it']).optional().or(z.literal('')),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      bio: user.bio || '',
      phone: user.phone || '',
      birthday: user.birthday || '',
      sex: user.sex || '',
      pronouns: user.pronouns || '',
      city: user.city || '',
      country: user.country || '',
      locale: user.locale || '',
    },
  })

  const generateUsername = useCallback((firstName: string, lastName: string) => {
    const parts = []
    if (firstName) parts.push(firstName.toLowerCase().replace(/\s+/g, ''))
    if (lastName) parts.push(lastName.toLowerCase().replace(/\s+/g, ''))
    return parts.join('.')
  }, [])

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'firstName' || name === 'lastName') {
        const username = generateUsername(value.firstName || '', value.lastName || '')
        if (username) {
          form.setValue('username', username, { shouldValidate: false })
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, generateUsername])

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      try {
        const updates: Partial<{
          username: string
          firstName: string
          lastName: string
          bio: string
          birthday: string
          sex: string
          pronouns: string
          country: string
          city: string
          locale: string
          phone: string
        }> = {}

        if (schema.username !== user.username) updates.username = schema.username || undefined
        if (schema.firstName !== user.firstName) updates.firstName = schema.firstName || undefined
        if (schema.lastName !== user.lastName) updates.lastName = schema.lastName || undefined
        if (schema.bio !== user.bio) updates.bio = schema.bio || undefined
        if (schema.phone !== user.phone) updates.phone = schema.phone || undefined
        if (schema.birthday !== user.birthday) updates.birthday = schema.birthday || undefined
        if (schema.sex !== user.sex) updates.sex = schema.sex || undefined
        if (schema.pronouns !== user.pronouns) updates.pronouns = schema.pronouns || undefined
        if (schema.city !== user.city) updates.city = schema.city || undefined
        if (schema.country !== user.country) updates.country = schema.country || undefined
        if (schema.locale !== user.locale) updates.locale = schema.locale || undefined

        const updatedUser = (await updateUser(updates)) as unknown as typeof user
        setUser?.(updatedUser)
        form.reset({
          username: updatedUser.username || '',
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || '',
          bio: updatedUser.bio || '',
          phone: updatedUser.phone || '',
          birthday: updatedUser.birthday || '',
          sex: updatedUser.sex || '',
          pronouns: updatedUser.pronouns || '',
          city: updatedUser.city || '',
          country: updatedUser.country || '',
          locale: updatedUser.locale || '',
        })
        toast.success(t('profileUpdated'))
      } catch (error) {
        console.error(error)
        toast.error(t('profileUpdateError'))
      }
    },
    [form, t, user, setUser]
  )

  const countries = useMemo(
    () => ['uk', 'us', 'it', 'fr', 'es', 'de', 'pt', 'cn', 'jp', 'ru', 'ar', 'br', 'ca', 'au', 'in', 'za', 'mx'],
    []
  )

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 font-semibold text-lg">{t('personalInfo')}</h3>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
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
                  name="lastName"
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
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('username')}</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-muted/50"
                        disabled
                        placeholder={t('usernamePlaceholder')}
                        readOnly
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        className="min-h-[100px] resize-none"
                        disabled={form.formState.isSubmitting}
                        placeholder={t('bioPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-lg">{t('location')}</h3>

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
                    <Select disabled={form.formState.isSubmitting} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('countryPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country} value={country}>
                            {tGlobal(`Countries.${country}` as Any)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-lg">{t('preferences')}</h3>

            <FormField
              control={form.control}
              name="locale"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>{t('locale')}</FormLabel>
                  <Select disabled={form.formState.isSubmitting} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectLocale')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {localeItems.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          <span className="flex items-center gap-2">
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button disabled={form.formState.isSubmitting} onClick={() => form.reset()} type="button" variant="outline">
            {t('cancel')}
          </Button>
          <Button
            disabled={defaultFormDisabled(form)}
            loading={form.formState.isSubmitting}
            type="submit"
            variant="brand"
          >
            {t('saveChanges')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
