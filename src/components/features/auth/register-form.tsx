'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { requestOrganizationRegistration } from '@/actions/organization'
import { Button } from '@/components/ui/button'
import { CountrySelect } from '@/components/ui/country-select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { AUTH_ROOT, EMAIL_REGEX } from '@/lib/constants'
import { defaultFormDisabled } from '@/lib/utils'

export const RegisterForm = () => {
  const t = useTranslations('Register')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const formSchema = useMemo(
    () =>
      z.object({
        orgName: z.string().nonempty(t('orgNameRequired')),
        orgEmail: z.string().nonempty(t('orgEmailRequired')).regex(EMAIL_REGEX, t('orgEmailInvalid')),
        orgCity: z.string().nonempty(t('orgCityRequired')),
        orgCountry: z.string().nonempty(t('orgCountryRequired')),
        orgUrl: z.string().optional(),
        firstName: z.string().nonempty(t('firstNameRequired')),
        lastName: z.string().optional(),
        registrantEmail: z.string().nonempty(t('emailRequired')).regex(EMAIL_REGEX, t('emailInvalid')),
        message: z.string().optional(),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      orgName: '',
      orgEmail: '',
      orgCity: '',
      orgCountry: '',
      orgUrl: '',
      firstName: '',
      lastName: '',
      registrantEmail: '',
      message: '',
    },
    resolver: zodResolver(formSchema),
  })

  const disabled = defaultFormDisabled(form)

  const onSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      setLoading(true)

      const { error } = await requestOrganizationRegistration({
        city: values.orgCity,
        country: values.orgCountry,
        email: values.orgEmail,
        firstName: values.firstName,
        lastName: values.lastName,
        message: values.message,
        name: values.orgName,
        registrantEmail: values.registrantEmail,
        url: values.orgUrl,
      })

      setLoading(false)

      if (error) {
        console.error(error)
        toast.error(t('submitError'))
        return
      }

      setSubmitted(true)
    },
    [t]
  )

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-lg border p-8 text-center">
        <CheckCircle2Icon className="size-12 text-green-500" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t('successTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('successMessage')}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={AUTH_ROOT}>{t('goToLogin')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{t('orgSectionTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('orgSectionDescription')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="orgName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('orgName')}</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder={t('orgNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orgEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orgEmail')}</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder={t('orgEmailPlaceholder')} type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orgUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('orgUrl')} <span className="text-muted-foreground">({t('optional')})</span>
                  </FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder={t('orgUrlPlaceholder')} type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orgCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orgCity')}</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder={t('orgCityPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orgCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orgCountry')}</FormLabel>
                  <FormControl>
                    <CountrySelect onChange={field.onChange} value={field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{t('repSectionTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('repSectionDescription')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('firstName')}</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder={t('firstNamePlaceholder')} {...field} />
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
                  <FormLabel>
                    {t('lastName')} <span className="text-muted-foreground">({t('optional')})</span>
                  </FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder={t('lastNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrantEmail"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder={t('emailPlaceholder')} type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    {t('message')} <span className="text-muted-foreground">({t('optional')})</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea disabled={loading} placeholder={t('messagePlaceholder')} rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button disabled={disabled || loading} type="submit">
            {loading ? t('submitting') : t('submit')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('alreadyHaveAccount')}{' '}
            <Link className="underline underline-offset-4 hover:text-foreground" href={AUTH_ROOT}>
              {t('login')}
            </Link>
          </p>
        </div>
      </form>
    </Form>
  )
}
