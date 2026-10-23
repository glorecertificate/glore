'use client'

import Link from 'next/link'

import { useFormatter, useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { type ApplicationInput, type ApplicationStep } from '@/db/queries/organization-application'
import { type MessageKey } from '@/lib/i18n'

import { type ApplicationForm } from './types'

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="grid gap-0.5 py-2 sm:grid-cols-[12rem_1fr] sm:gap-4">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="text-sm font-medium wrap-break-word">{value}</dd>
  </div>
)

export const CharterStep = ({ form, onEdit }: { form: ApplicationForm; onEdit: (step: ApplicationStep) => void }) => {
  const { number } = useFormatter()
  const t = useTranslations('Register')
  const tCountries = useTranslations('Intl.Countries')
  const values = useWatch({ control: form.control, defaultValue: form.getValues() }) as ApplicationInput
  const countryKey = values.country?.toLowerCase() as MessageKey<'Intl.Countries'>
  const country = tCountries.has(countryKey) ? tCountries(countryKey) : values.country
  const volunteers = Number(values.volunteersPerYear)
  const empty = t('reviewEmpty')

  const sections = [
    {
      rows: [
        [t('name'), values.name],
        [t('legalName'), values.legalName],
        [t('registryId'), values.registryId],
        [t('country'), country],
        [t('city'), values.city],
        [t('orgEmail'), values.email],
        [t('url'), values.url || empty],
        [t('volunteersPerYear'), Number.isFinite(volunteers) ? number(volunteers) : values.volunteersPerYear],
      ],
      step: 'organization',
      title: t('step_organization'),
    },
    {
      rows: [
        [t('legalRepresentative'), [values.firstName, values.lastName].filter(Boolean).join(' ')],
        [t('email'), values.registrantEmail],
        [t('contactName'), values.contactName || empty],
        [t('contactEmail'), values.contactEmail || empty],
      ],
      step: 'representative',
      title: t('step_representative'),
    },
    {
      rows: [[t('motivation'), values.motivation]],
      step: 'motivation',
      title: t('step_motivation'),
    },
  ] as const satisfies { rows: (readonly [string, string])[]; step: ApplicationStep; title: string }[]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sections.map(section => (
          <section className="rounded-lg border p-4" key={section.step}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <Button onClick={() => onEdit(section.step)} size="sm" type="button" variant="ghost">
                {t('edit')}
              </Button>
            </div>
            <dl className="mt-2 divide-y">
              {section.rows.map(([label, value]) => (
                <Row key={label} label={label} value={value || empty} />
              ))}
            </dl>
          </section>
        ))}
      </div>

      <FormField
        control={form.control}
        name="charterAccepted"
        render={({ field }) => (
          <FormItem className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  className="mt-0.5"
                  onBlur={field.onBlur}
                  onCheckedChange={checked => field.onChange(checked === true)}
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="leading-5">{t('charterAccept')}</FormLabel>
                <p className="text-sm text-muted-foreground">
                  {t('charterHelp')}{' '}
                  <Link
                    className="font-medium text-link underline underline-offset-4"
                    href="/quality-charter"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t('charterLink')}
                  </Link>
                </p>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
