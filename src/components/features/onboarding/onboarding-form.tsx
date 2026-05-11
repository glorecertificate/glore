'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { completeOnboarding } from '@/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSelect } from '@/components/ui/language-select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PASSWORD_REGEX } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const OnboardingForm = ({
  email,
  firstName = '',
  lastName = '',
  locale = 'en',
}: {
  email: string
  firstName?: string
  lastName?: string
  locale?: Locale
}) => {
  const t = useTranslations('Onboarding')
  const [submitting, setSubmitting] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const formSchema = z
    .object({
      birthday: z.string().min(1, { message: t('birthdayRequired') }),
      confirmPassword: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string(),
      password: z.string().min(8).regex(PASSWORD_REGEX),
      phone: z.string().min(1, { message: t('phoneRequired') }),
      preferredLanguage: z.enum(['en', 'es', 'it']).optional().or(z.literal('')),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    })

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      firstName,
      lastName,
      birthday: '',
      phone: '',
      preferredLanguage: locale,
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true)

      const result = await completeOnboarding({
        birthday: values.birthday,
        firstName: values.firstName,
        lastName: values.lastName,
        locale: (values.preferredLanguage as Locale) || undefined,
        password: values.password,
        phone: values.phone,
      })

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success(t('success'))
    } catch {
      toast.error(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedBirthday = form.watch('birthday')

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label>{t('emailLabel')}</Label>
          <Input className="bg-muted/50" disabled value={email} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('firstNameLabel')}</FormLabel>
                <FormControl>
                  <Input autoFocus disabled={submitting} placeholder={t('firstNamePlaceholder')} {...field} />
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
                <FormLabel>{t('lastNameLabel')}</FormLabel>
                <FormControl>
                  <Input disabled={submitting} placeholder={t('lastNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="birthday"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('birthdayLabel')} <span className="text-destructive">{'*'}</span>
                </FormLabel>
                <Popover onOpenChange={setCalendarOpen} open={calendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        disabled={submitting}
                        variant="outline"
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {field.value || t('birthdayPlaceholder')}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      captionLayout="dropdown"
                      defaultMonth={selectedBirthday ? new Date(selectedBirthday) : undefined}
                      disabled={date => date > new Date()}
                      endMonth={new Date()}
                      mode="single"
                      onSelect={date => {
                        field.onChange(date ? date.toISOString().split('T')[0] : '')
                        setCalendarOpen(false)
                      }}
                      selected={selectedBirthday ? new Date(selectedBirthday) : undefined}
                      startMonth={new Date(1900, 0)}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('phoneLabel')} <span className="text-destructive">{'*'}</span>
                </FormLabel>
                <FormControl>
                  <Input disabled={submitting} placeholder={t('phonePlaceholder')} type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="preferredLanguage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('preferredLanguageLabel')}</FormLabel>
              <FormDescription>{t('preferredLanguageDescription')}</FormDescription>
              <FormControl>
                <LanguageSelect
                  controlled
                  disabled={submitting}
                  onChange={field.onChange}
                  value={field.value as Locale}
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
            <FormItem>
              <FormLabel>{t('passwordLabel')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="new-password"
                  disabled={submitting}
                  placeholder={t('passwordPlaceholder')}
                  type="password"
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
              <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="new-password"
                  disabled={submitting}
                  placeholder={t('confirmPasswordPlaceholder')}
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" disabled={submitting} loading={submitting} type="submit" variant="brand">
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Form>
  )
}
