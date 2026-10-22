'use client'

import { useTranslations } from 'next-intl'

import { type CertificateReviewNotes, type HolderCourseResult, type ReviewHolder } from '@/actions/certificates/queries'
import { formatActivityPeriod, meetsActivityRule } from '@/components/features/certificates/rules'
import { useI18n } from '@/components/providers/i18n'
import { Badge } from '@/components/ui/badge'
import { Banner } from '@/components/ui/banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LevelDots } from '@/components/ui/level-dots'
import { type Certificate } from '@/db/queries/certificate'
import { SKILL_LEVELS } from '@/lib/constants'
import { fullName } from '@/lib/utils'

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right font-medium wrap-break-word">{value}</dd>
  </div>
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
  const t = useTranslations('Certificates.review')
  const tLevels = useTranslations('Common.skillLevels')
  const tCountries = useTranslations('Intl.Countries')
  const { locale, localize } = useI18n()

  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const format = (value: string | null) => (value ? date.format(new Date(value)) : '-')
  const nationality = holder.nationality
    ? tCountries.has(holder.nationality as never)
      ? tCountries(holder.nationality as never)
      : holder.nationality.toUpperCase()
    : '-'
  const rule = meetsActivityRule(certificate)
  const sectionLabels = {
    experience: t('sectionExperience'),
    personal: t('sectionPersonal'),
    skills: t('sectionSkills'),
    tasks: t('sectionTasks'),
  }

  return (
    <div className="flex flex-col gap-4">
      {previous && (
        <Banner variant="warning">
          <div className="min-w-0 space-y-1">
            <p className="font-medium">{t('previousFeedback')}</p>
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
          </div>
        </Banner>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('volunteer')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-2">
            <Row label={t('name')} value={fullName(holder)} />
            <Row label={t('email')} value={holder.email} />
            <Row label={t('birthday')} value={format(holder.birthday)} />
            <Row label={t('birthPlace')} value={holder.birthPlace ?? '-'} />
            <Row label={t('nationality')} value={nationality} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('experience')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <dl className="flex flex-col gap-2">
            <Row
              label={t('period')}
              value={formatActivityPeriod(certificate, date, ({ end, start }) => `${start} - ${end}`)}
            />
            <Row label={t('hours')} value={certificate.activityDuration} />
            <Row label={t('location')} value={certificate.activityLocation} />
          </dl>
          <Badge variant={rule ? 'success' : 'destructive'}>{rule ? t('ruleMet') : t('ruleUnmet')}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('tasks')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {certificate.tasks.map(task => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('skills')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {certificate.skills
            .toSorted((a, b) => a.sortOrder - b.sortOrder)
            .map(skill => {
              const result = results[skill.course.id]
              const level = SKILL_LEVELS[(skill.selfLevel ?? 0) - 1]
              return (
                <div className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0" key={skill.id}>
                  <p className="text-sm font-medium">
                    {skill.course.title ? localize(skill.course.title, 'en') : skill.course.slug}
                  </p>
                  {level && skill.selfLevel ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-xs text-muted-foreground">{t('selfLevel')}</span>
                      <LevelDots label={tLevels(level)} level={skill.selfLevel as 1 | 2 | 3 | 4 | 5} />
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {result?.completedAt ? t('completedOn', { date: format(result.completedAt) }) : t('notCompleted')}
                    {result?.rating ? ` · ${t('courseRating', { rating: result.rating.toFixed(1) })}` : ''}
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
