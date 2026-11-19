import { type Route } from 'next'

import { useFormatter, useTranslations } from 'next-intl'

import { type VolunteerSummary } from '@/actions/dashboard/core'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { Link } from '@/components/ui/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { timestampMillis } from '@/db/queries/organization'
import { VERIFY_ROOT } from '@/lib/constants'

export const VolunteerRequest = ({
  organization,
  volunteer,
}: {
  organization: string | null
  volunteer: VolunteerSummary
}) => {
  const t = useTranslations('Dashboard.volunteer')
  const tJourney = useTranslations('Dashboard.journey')
  const { dateTime, list } = useFormatter()
  const { certificate, journey, skills } = volunteer
  const { phase } = journey
  const reason = phase === 'rejected' ? certificate?.rejectedReason : certificate?.revokedReason

  return (
    <Card className="h-full" data-slot="volunteer-request">
      <CardHeader>
        <CardTitle>{t('requestTitle')}</CardTitle>
        <CardAction>
          {certificate ? (
            <CertificateStatusBadge status={certificate.status} />
          ) : (
            <StatusBadge tone="draft">{tJourney('status.ready')}</StatusBadge>
          )}
        </CardAction>
      </CardHeader>
      <DescriptionList layout="rows">
        {organization && (
          <DescriptionItem>
            <DescriptionTerm>{t('organization')}</DescriptionTerm>
            <DescriptionDetails>{organization}</DescriptionDetails>
          </DescriptionItem>
        )}
        <DescriptionItem>
          <DescriptionTerm>{t('skills')}</DescriptionTerm>
          <DescriptionDetails>
            {skills.length > 0 ? list(skills.map(({ title }) => title)) : t('noSkills')}
          </DescriptionDetails>
        </DescriptionItem>
        <DescriptionItem>
          <DescriptionTerm>{t('experience')}</DescriptionTerm>
          <DescriptionDetails>
            {certificate && certificate.activityDuration > 0
              ? t('hours', { hours: certificate.activityDuration })
              : t('notEntered')}
          </DescriptionDetails>
        </DescriptionItem>
        {certificate && (
          <DescriptionItem>
            <DescriptionTerm>{t('lastSaved')}</DescriptionTerm>
            <DescriptionDetails>
              {dateTime(new Date(timestampMillis(certificate.updatedAt)), { dateStyle: 'medium' })}
            </DescriptionDetails>
          </DescriptionItem>
        )}
        {certificate?.code && (
          <DescriptionItem>
            <DescriptionTerm>{tJourney('code.label')}</DescriptionTerm>
            <DescriptionDetails className="font-mono">
              {phase === 'issued' ? (
                <Link className="text-action-text hover:underline" href={`${VERIFY_ROOT}/${certificate.code}` as Route}>
                  {certificate.code}
                </Link>
              ) : (
                certificate.code
              )}
            </DescriptionDetails>
          </DescriptionItem>
        )}
        {reason && (
          <DescriptionItem>
            <DescriptionTerm>{tJourney('reason.label')}</DescriptionTerm>
            <DescriptionDetails className="whitespace-pre-line">{reason}</DescriptionDetails>
          </DescriptionItem>
        )}
      </DescriptionList>
    </Card>
  )
}
