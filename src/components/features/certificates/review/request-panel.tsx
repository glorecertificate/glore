'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { useFormContext, useWatch } from 'react-hook-form'

import { type CertificateReviewNotes, type HolderCourseResult, type ReviewHolder } from '@/actions/certificates/queries'
import { ExperienceFields, TaskFields } from '@/components/features/certificates/experience-fields'
import { formatActivityPeriod, meetsActivityRule } from '@/components/features/certificates/rules'
import { type ReviewFormValues } from '@/components/features/certificates/schemas'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { LevelDots } from '@/components/ui/level-dots'
import { StatusBadge } from '@/components/ui/status-badge'
import { type Certificate } from '@/db/queries/certificate'
import { SKILL_LEVELS } from '@/db/queries/skill-level-description'
import { fullName } from '@/lib/utils'

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <DescriptionItem>
    <DescriptionTerm>{label}</DescriptionTerm>
    <DescriptionDetails>{value}</DescriptionDetails>
  </DescriptionItem>
)

export const RequestPanel = ({
  certificate,
  holder,
  previous,
  results,
}: {
  certificate: Certificate
  holder: ReviewHolder
  previous: CertificateReviewNotes | null
  results: Record<number, HolderCourseResult>
}) => {
  const t = useTranslations('CertificateReview')
  const tDetail = useTranslations('CertificateDetail')
  const tLevels = useTranslations('Common.skillLevels')
  const tCountries = useTranslations('Intl.Countries')
  const { locale, localize } = useI18n()

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
    <div className="flex flex-col gap-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="type-label">{t('volunteer')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DescriptionList layout="inline">
            <Row label={t('name')} value={fullName(holder)} />
            <Row label={t('email')} value={holder.email} />
            <Row label={t('birthday')} value={format(holder.birthday)} />
            <Row label={t('birthPlace')} value={holder.birthPlace ?? '-'} />
            <Row label={t('nationality')} value={nationality} />
          </DescriptionList>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="type-label">{t('experienceTitle')}</CardTitle>
          <Button
            aria-expanded={editing}
            className="text-action-text"
            onClick={() => setEditing(current => !current)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {editing ? t('doneEditing') : t('edit')}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {editing ? (
            <>
              <ExperienceFields />
              <TaskFields />
            </>
          ) : (
            <>
              <DescriptionList layout="inline">
                <Row
                  label={t('period')}
                  value={formatActivityPeriod(period, date, range => tDetail('periodValue', range))}
                />
                <Row label={t('hours')} value={period.activityDuration} />
                <Row label={t('location')} value={values.activityLocation || '-'} />
              </DescriptionList>
              <StatusBadge tone={rule ? 'success' : 'danger'}>{rule ? t('ruleMet') : t('ruleUnmet')}</StatusBadge>
              <div className="flex flex-col gap-1.5">
                <p className="type-label text-muted-foreground">{t('tasks')}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {tasks.map(task => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="type-label">{t('skills')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {certificate.skills
            .toSorted((a, b) => a.sortOrder - b.sortOrder)
            .map(skill => {
              const result = results[skill.course.id]
              const chosen = result?.level ?? null
              const chosenText = chosen ? result?.descriptions[chosen] : null
              return (
                <div className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0" key={skill.id}>
                  <p className="text-sm font-medium">
                    {skill.course.title ? localize(skill.course.title, 'en') : skill.course.slug}
                  </p>
                  {chosen ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-xs text-muted-foreground">{t('selfLevel')}</span>
                        <LevelDots
                          label={tLevels(chosen)}
                          level={SKILL_LEVELS.indexOf(chosen) + 1}
                          steps={SKILL_LEVELS.length}
                        />
                      </div>
                      {chosenText && <p className="text-sm text-muted-foreground">{localize(chosenText)}</p>}
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {result?.completedAt ? t('completedOn', { date: format(result.completedAt) }) : t('notCompleted')}
                  </p>
                  {skill.evidence && <p className="text-sm whitespace-pre-wrap">{skill.evidence}</p>}
                  {result?.reflection && result.reflection !== skill.evidence && (
                    <p className="border-l-2 pl-3 text-sm whitespace-pre-wrap text-muted-foreground">
                      {result.reflection}
                    </p>
                  )}
                </div>
              )
            })}
        </CardContent>
      </Card>
    </div>
  )
}
