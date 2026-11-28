'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { useFormContext, useWatch } from 'react-hook-form'

import { type CertificateReviewNotes, type ReviewHolder } from '@/actions/certificates/queries'
import { ExperienceFields, TaskFields } from '@/components/features/certificates/experience-fields'
import { formatActivityPeriod, meetsActivityRule } from '@/components/features/certificates/rules'
import { type ReviewFormValues } from '@/components/features/certificates/schemas'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { StatusBadge } from '@/components/ui/status-badge'
import { useResetOnHide } from '@/hooks/use-reset-on-hide'

const Row = ({ label, stacked, value }: { label: string; stacked?: boolean; value: React.ReactNode }) => (
  <DescriptionItem
    className={stacked ? 'group-data-[layout=inline]/dl:flex-col group-data-[layout=inline]/dl:gap-0.5' : undefined}
  >
    <DescriptionTerm>{label}</DescriptionTerm>
    <DescriptionDetails className={stacked ? 'group-data-[layout=inline]/dl:text-left' : undefined}>
      {value}
    </DescriptionDetails>
  </DescriptionItem>
)

export const RequestPanel = ({
  holder,
  previous,
}: {
  holder: ReviewHolder
  previous: CertificateReviewNotes | null
}) => {
  const t = useTranslations('CertificateReview')
  const tDetail = useTranslations('CertificateDetail')
  const tCountries = useTranslations('Intl.Countries')
  const { locale } = useI18n()

  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const format = (value: string | null) => (value ? date.format(new Date(value)) : '-')
  const nationalityKey = holder.nationality?.toLowerCase()
  const nationality = nationalityKey
    ? tCountries.has(nationalityKey as never)
      ? tCountries(nationalityKey as never)
      : nationalityKey.toUpperCase()
    : '-'
  const { control } = useFormContext<ReviewFormValues>()
  const values = useWatch({ control })
  const [editing, setEditing] = useState(false)

  useResetOnHide(() => setEditing(false))
  const period = {
    activityDuration: Number(values.activityDuration) || 0,
    activityEndDate: values.activityEndDate ?? '',
    activityStartDate: values.activityStartDate ?? '',
  }
  const rule = meetsActivityRule(period)
  const tasks = (values.tasks ?? []).flatMap(task => (task?.text?.trim() ? [task.text.trim()] : []))
  const sectionLabels = {
    experience: t('sectionExperience'),
    personal: t('sectionPersonal'),
    skills: t('sectionSkills'),
    tasks: t('sectionTasks'),
  }

  return (
    <div className="flex flex-col gap-6">
      {previous && (
        <Card className="bg-surface-muted">
          <CardHeader>
            <CardTitle className="type-label">{t('previousFeedback')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {previous.comment && <p className="whitespace-pre-wrap text-muted-foreground">{previous.comment}</p>}
            {Object.entries(previous.sectionComments).map(([section, text]) =>
              text ? (
                <p className="text-muted-foreground" key={section}>
                  <span className="font-medium text-foreground">
                    {sectionLabels[section as keyof typeof sectionLabels]}
                  </span>
                  {': '}
                  {text}
                </p>
              ) : null
            )}
          </CardContent>
        </Card>
      )}

      <Card className="gap-0 p-0 lg:grid lg:grid-cols-[1.1fr_1.1fr_1fr]">
        <section className="flex min-w-0 flex-col gap-3 p-5 sm:px-6">
          <h2 className="type-overline text-muted-foreground">{t('volunteer')}</h2>
          <DescriptionList layout="inline">
            <Row label={t('email')} stacked value={holder.email} />
            <Row label={t('birthday')} value={format(holder.birthday)} />
            <Row label={t('birthPlace')} value={holder.birthPlace ?? '-'} />
            <Row label={t('nationality')} value={nationality} />
          </DescriptionList>
        </section>

        {editing ? (
          <section className="flex min-w-0 flex-col gap-5 border-t border-border-subtle p-5 sm:px-6 lg:col-span-2 lg:border-t-0 lg:border-l">
            <div className="flex items-center justify-between gap-3">
              <h2 className="type-overline text-muted-foreground">{t('experienceTitle')}</h2>
              <Button
                aria-expanded
                className="text-action-text"
                onClick={() => setEditing(false)}
                size="text"
                type="button"
                variant="link"
              >
                {t('doneEditing')}
              </Button>
            </div>
            <div className="flex flex-col gap-6">
              <ExperienceFields />
              <TaskFields />
            </div>
          </section>
        ) : (
          <>
            <section className="flex min-w-0 flex-col gap-3 border-t border-border-subtle p-5 sm:px-6 lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between gap-3">
                <h2 className="type-overline text-muted-foreground">{t('experience')}</h2>
                <Button
                  aria-expanded={false}
                  className="text-action-text"
                  onClick={() => setEditing(true)}
                  size="text"
                  type="button"
                  variant="link"
                >
                  {t('edit')}
                </Button>
              </div>
              <DescriptionList layout="inline">
                <Row
                  label={t('period')}
                  value={formatActivityPeriod(period, date, range => tDetail('periodValue', range))}
                />
                <Row label={t('hours')} value={period.activityDuration} />
                <Row label={t('location')} value={values.activityLocation || '-'} />
              </DescriptionList>
              <StatusBadge tone={rule ? 'success' : 'danger'}>{rule ? t('ruleMet') : t('ruleUnmet')}</StatusBadge>
            </section>
            <section className="flex min-w-0 flex-col gap-3 border-t border-border-subtle p-5 sm:px-6 lg:border-t-0 lg:border-l">
              <h2 className="type-overline text-muted-foreground">{t('tasks')}</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm marker:text-muted-foreground">
                {tasks.map(task => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </section>
          </>
        )}
      </Card>
    </div>
  )
}
