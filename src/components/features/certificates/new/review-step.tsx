'use client'

import { type Locale, useTranslations } from 'next-intl'
import { useFormContext, useWatch } from 'react-hook-form'

import { CertificateThumbnail } from '@/components/features/certificates/certificate-thumbnail'
import { FieldError } from '@/components/features/certificates/field-error'
import { SectionNote } from '@/components/features/certificates/new/section-note'
import { type SkillOption } from '@/components/features/certificates/new/values'
import { type PersonalField, pdfDate } from '@/components/features/certificates/rules'
import { type WizardValues } from '@/components/features/certificates/schemas'
import { Banner } from '@/components/ui/banner'
import { CountrySelect } from '@/components/ui/country-select'
import { DatePicker } from '@/components/ui/date-picker'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LanguageSelect } from '@/components/ui/language-select'
import { DEFAULT_LOCALE, type IntlRecord, localizeRecord } from '@/lib/i18n'

interface ReviewStepProps {
  comment?: string
  firstName: string
  lastName: string | null
  missing: readonly PersonalField[]
  options: SkillOption[]
  organization: { logoUrl: string | null; name: string }
}

const Thumbnail = ({ firstName, lastName, options, organization }: Omit<ReviewStepProps, 'comment' | 'missing'>) => {
  const t = useTranslations('Certificates.wizard')
  const { control } = useFormContext<WizardValues>()
  const values = useWatch({ control })
  const language = values.language ?? DEFAULT_LOCALE
  const titles = new Map(
    options.map(({ id, slug, title }) => [
      id,
      title ? localizeRecord(title as IntlRecord, language as Locale, DEFAULT_LOCALE) || slug : slug,
    ])
  )
  const holderLastName = values.personal?.lastName?.trim() || lastName

  return (
    <CertificateThumbnail
      end={pdfDate(values.activityEndDate)}
      firstName={firstName}
      hours={Number(values.activityDuration) || null}
      label={t('thumbnailLabel')}
      lastName={holderLastName}
      location={values.activityLocation}
      logoUrl={organization.logoUrl}
      organization={organization.name}
      skills={(values.skills ?? []).flatMap(skill =>
        skill?.courseId ? [{ level: skill.selfLevel ?? 0, name: titles.get(skill.courseId) ?? '' }] : []
      )}
      start={pdfDate(values.activityStartDate)}
      tasks={(values.tasks ?? []).flatMap(task => (task?.text?.trim() ? [task.text.trim()] : []))}
    />
  )
}

export const ReviewStep = ({ comment, missing, ...thumbnail }: ReviewStepProps) => {
  const t = useTranslations('Certificates.wizard')
  const { control } = useFormContext<WizardValues>()

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="flex flex-col gap-5">
        <SectionNote comment={comment} />
        <FormField
          control={control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('language')}</FormLabel>
              <FormControl>
                <LanguageSelect controlled onChange={field.onChange} value={field.value as Locale} />
              </FormControl>
              <p className="text-sm text-muted-foreground">{t('languageHint')}</p>
              <FieldError />
            </FormItem>
          )}
        />

        {missing.length > 0 && (
          <div className="flex flex-col gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{t('personalTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('personalDescription')}</p>
            </div>
            {missing.includes('lastName') && (
              <FormField
                control={control}
                name="personal.lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('lastName')}</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" {...field} />
                    </FormControl>
                    <FieldError />
                  </FormItem>
                )}
              />
            )}
            {missing.includes('birthday') && (
              <FormField
                control={control}
                name="personal.birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('birthday')}</FormLabel>
                    <DatePicker onChange={field.onChange} value={field.value} />
                    <FieldError />
                  </FormItem>
                )}
              />
            )}
            {missing.includes('birthPlace') && (
              <FormField
                control={control}
                name="personal.birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('birthPlace')}</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
                    </FormControl>
                    <FieldError />
                  </FormItem>
                )}
              />
            )}
            {missing.includes('nationality') && (
              <FormField
                control={control}
                name="personal.nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nationality')}</FormLabel>
                    <FormControl>
                      <CountrySelect onChange={field.onChange} value={field.value} />
                    </FormControl>
                    <FieldError />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        <Banner>
          <p>{t('submitNote')}</p>
        </Banner>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">{t('thumbnailTitle')}</p>
        <Thumbnail {...thumbnail} />
      </div>
    </div>
  )
}
