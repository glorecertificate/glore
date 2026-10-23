'use client'

import { useTranslations } from 'next-intl'

import { formatActivityPeriod } from '@/components/features/certificates/rules'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LevelDots } from '@/components/ui/level-dots'
import { type Certificate } from '@/db/queries/certificate'
import { SKILL_LEVELS } from '@/lib/constants'

export const CertificateSummary = ({ certificate }: { certificate: Certificate }) => {
  const t = useTranslations('CertificateCredential')
  const tDetail = useTranslations('CertificateDetail')
  const tLevels = useTranslations('Common.skillLevels')
  const { locale, localize } = useI18n()
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })

  const meta = [
    {
      icon: 'calendar',
      key: 'period',
      label: t('period'),
      value: formatActivityPeriod(certificate, formatter, values => tDetail('periodValue', values)),
    },
    {
      icon: 'timer',
      key: 'hours',
      label: t('hours'),
      value: tDetail('hoursValue', { hours: certificate.activityDuration }),
    },
    { icon: 'map-pin', key: 'location', label: t('location'), value: certificate.activityLocation },
  ] as const

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {meta.map(({ icon, key, label, value }) => (
            <div className="flex items-start gap-2.5" key={key}>
              <LucideIcon name={icon} className="mt-0.5 size-4 shrink-0 text-brand-text" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {certificate.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{tDetail('tasks')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {certificate.tasks.map(task => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t('skills')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-4">
            {certificate.skills
              .toSorted((a, b) => a.sortOrder - b.sortOrder)
              .map(skill => {
                const level = skill.level ?? skill.selfLevel
                const name = SKILL_LEVELS[(level ?? 0) - 1]
                return (
                  <li className="flex flex-col gap-1.5" key={skill.id}>
                    <p className="text-sm font-medium">
                      {skill.course.title ? localize(skill.course.title) : skill.course.slug}
                    </p>
                    {level && name ? <LevelDots label={tLevels(name)} level={level as 1 | 2 | 3 | 4 | 5} /> : null}
                    {skill.statement && <p className="text-sm text-muted-foreground">{skill.statement}</p>}
                  </li>
                )
              })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
