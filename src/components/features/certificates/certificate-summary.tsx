'use client'

import { useTranslations } from 'next-intl'

import { formatActivityDate, formatActivityPeriod } from '@/components/features/certificates/rules'
import { SkillLevel } from '@/components/features/certificates/skill-level'
import { issuedSkillRendering } from '@/components/features/certificates/snapshot'
import { useI18n } from '@/components/providers/i18n'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { type Certificate } from '@/db/queries/certificate'

export const CertificateDetails = ({ certificate }: { certificate: Certificate }) => {
  const t = useTranslations('CertificateCredential')
  const tDetail = useTranslations('CertificateDetail')
  const tOrg = useTranslations('CertificateOrg')
  const { locale } = useI18n()
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const issuedAt =
    certificate.isApproved || certificate.isRevoked ? (certificate.issuedAt ?? certificate.reviewedAt) : null

  const rows = [
    { key: 'organization', label: tDetail('organization'), value: certificate.organization.name },
    {
      key: 'period',
      label: t('period'),
      value: formatActivityPeriod(certificate, formatter, values => tDetail('periodValue', values)),
    },
    { key: 'hours', label: t('hours'), value: tDetail('hoursValue', { hours: certificate.activityDuration }) },
    { key: 'location', label: t('location'), value: certificate.activityLocation || '-' },
    ...(issuedAt
      ? [{ key: 'issued', label: tDetail('issued'), value: formatActivityDate(issuedAt.slice(0, 10), formatter) }]
      : []),
    ...(certificate.code && (certificate.isApproved || certificate.isRevoked)
      ? [{ key: 'code', label: tDetail('code'), value: certificate.code }]
      : []),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-label text-muted-foreground">{tDetail('details')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <DescriptionList columns={1}>
          {rows.map(({ key, label, value }) => (
            <DescriptionItem key={key}>
              <DescriptionTerm>{label}</DescriptionTerm>
              <DescriptionDetails className={key === 'code' ? 'font-mono text-xs' : undefined}>
                {value}
              </DescriptionDetails>
            </DescriptionItem>
          ))}
        </DescriptionList>
        {certificate.isHolderDeleted && <Badge variant="outline">{tOrg('holderDeleted')}</Badge>}
      </CardContent>
    </Card>
  )
}

export const CertificateTasks = ({ certificate }: { certificate: Certificate }) => {
  const tDetail = useTranslations('CertificateDetail')

  if (certificate.tasks.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-label text-muted-foreground">{tDetail('tasks')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {certificate.tasks.map(task => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export const CertificateSkills = ({ certificate }: { certificate: Certificate }) => {
  const t = useTranslations('CertificateCredential')
  const { locale, localize } = useI18n()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-label text-muted-foreground">{t('skills')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-4">
          {certificate.skills
            .toSorted((a, b) => a.sortOrder - b.sortOrder)
            .map(skill => {
              const view = issuedSkillRendering(certificate.snapshot, skill.course.id, skill.level)
              return (
                <li className="flex flex-col gap-1.5" key={skill.id}>
                  <p className="text-sm font-medium">
                    {skill.course.title ? localize(skill.course.title) : skill.course.slug}
                  </p>
                  {view && <SkillLevel locale={locale} rendering={view} />}
                </li>
              )
            })}
        </ul>
      </CardContent>
    </Card>
  )
}
