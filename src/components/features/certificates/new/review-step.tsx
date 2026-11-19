'use client'

import { type Locale, useTranslations } from 'next-intl'
import { useFormContext, useWatch } from 'react-hook-form'

import { CertificatePage } from '@/components/features/certificates/certificate-page'
import { FieldError } from '@/components/features/certificates/field-error'
import { SectionNote } from '@/components/features/certificates/new/section-note'
import { type SkillOption } from '@/components/features/certificates/new/values'
import { regionName } from '@/components/features/certificates/region-name'
import { type PersonalField, formatActivityPeriod } from '@/components/features/certificates/rules'
import { type WizardValues } from '@/components/features/certificates/schemas'
import { useI18n } from '@/components/providers/i18n'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
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
  onChange: (step: number) => void
  options: SkillOption[]
  organization: { logoUrl: string | null; name: string }
}

const Thumbnail = ({
  firstName,
  lastName,
  options,
  organization,
}: Omit<ReviewStepProps, 'comment' | 'missing' | 'onChange'>) => {
  const t = useTranslations('CertificateWizard')
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
    <CertificatePage
      input={{
        activity: {
          duration: Number(values.activityDuration) || null,
          endDate: values.activityEndDate || null,
          location: values.activityLocation || null,
          startDate: values.activityStartDate || null,
          tasks: (values.tasks ?? []).flatMap(task => (task?.text?.trim() ? [task.text.trim()] : [])),
        },
        code: null,
        holder: {
          birthPlace: values.personal?.birthPlace || null,
          birthday: values.personal?.birthday || null,
          firstName,
          lastName: holderLastName ?? null,
          nationality: regionName(values.personal?.nationality || null, language),
        },
        issuedAt: null,
        organization: {
          legalRepresentative: null,
          logoUrl: organization.logoUrl,
          name: organization.name,
          signatureUrl: null,
        },
        skills: (values.skills ?? []).flatMap(skill => {
          const option = options.find(({ id }) => id === skill?.courseId)
          if (!option) return []
          return [
            {
              description: option.description
                ? localizeRecord(option.description, language as Locale, DEFAULT_LOCALE) || null
                : null,
              icon: option.icon,
              level: 0,
              name: titles.get(option.id) ?? '',
              steps: 0,
            },
          ]
        }),
      }}
      label={t('thumbnailLabel')}
      language={language}
    />
  )
}

const RATINGS = ['experience', 'support', 'certificationSupport'] as const

const Answers = ({
  onChange,
  options,
  organization,
}: {
  onChange: (step: number) => void
  options: SkillOption[]
  organization: string
}) => {
  const t = useTranslations('CertificateWizard')
  const tDetail = useTranslations('CertificateDetail')
  const { locale } = useI18n()
  const { control } = useFormContext<WizardValues>()
  const values = useWatch({ control })
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const language = values.language ?? DEFAULT_LOCALE
  const titles = new Map(
    options.map(({ id, slug, title }) => [
      id,
      title ? localizeRecord(title as IntlRecord, language as Locale, DEFAULT_LOCALE) || slug : slug,
    ])
  )
  const tasks = (values.tasks ?? []).flatMap(task => (task?.text?.trim() ? [task.text.trim()] : []))
  const skills = (values.skills ?? []).flatMap(skill => (skill?.courseId ? [titles.get(skill.courseId) ?? ''] : []))
  const rating = values.rating
  const ratingLabels = {
    certificationSupport: t('ratingCertificationSupport'),
    experience: t('ratingExperience', { organization }),
    support: t('ratingSupport'),
  }
  const ratings = RATINGS.flatMap(key => {
    const score = rating?.[key]
    return typeof score === 'number' ? [`${ratingLabels[key]} ${score}/5`] : []
  })

  const rows = [
    {
      key: 'period',
      label: t('summaryPeriod'),
      step: 0,
      value: formatActivityPeriod(
        { activityEndDate: values.activityEndDate ?? '', activityStartDate: values.activityStartDate ?? '' },
        formatter,
        range => tDetail('periodValue', range)
      ),
    },
    {
      key: 'hours',
      label: t('hours'),
      step: 0,
      value: tDetail('hoursValue', { hours: Number(values.activityDuration) || 0 }),
    },
    { key: 'location', label: t('location'), step: 0, value: values.activityLocation || '-' },
    { key: 'tasks', label: t('tasksTitle'), step: 0, value: tasks },
    { key: 'skills', label: t('stepsSkills'), step: 1, value: skills },
    { key: 'rating', label: t('stepsOrganization'), step: 2, value: ratings },
  ]

  return (
    <dl className="flex flex-col divide-y rounded-lg border" data-slot="answers">
      {rows.map(row => (
        <div
          className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]"
          key={row.key}
        >
          <dt className="text-sm text-muted-foreground max-sm:col-span-2">{row.label}</dt>
          <dd className="min-w-0 text-sm font-medium">
            {Array.isArray(row.value) ? (
              <ul className="flex flex-col gap-0.5">
                {row.value.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              row.value
            )}
          </dd>
          <Button
            aria-label={t('changeSection', { section: row.label })}
            className="text-action-text"
            onClick={() => onChange(row.step)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t('change')}
          </Button>
        </div>
      ))}
    </dl>
  )
}

export const ReviewStep = ({ comment, missing, onChange, ...thumbnail }: ReviewStepProps) => {
  const t = useTranslations('CertificateWizard')
  const { control } = useFormContext<WizardValues>()

  return (
    <div className="flex flex-col gap-6">
      <SectionNote comment={comment} />
      <Answers onChange={onChange} options={thumbnail.options} organization={thumbnail.organization.name} />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">{t('thumbnailTitle')}</p>
        <div className="max-w-md">
          <Thumbnail {...thumbnail} />
        </div>
      </div>
      <div className="flex flex-col gap-5">
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
                    <DatePicker onBlur={field.onBlur} onChange={field.onChange} value={field.value} />
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
    </div>
  )
}
