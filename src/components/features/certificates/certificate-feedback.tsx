'use client'

import { useTranslations } from 'next-intl'

import { type CertificateReviewNotes } from '@/actions/certificates/queries'
import { CERTIFICATE_SECTIONS } from '@/components/features/certificates/schemas'
import { LucideIcon } from '@/components/icons/lucide'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Certificate } from '@/db/queries/certificate'

export const CertificateFeedback = ({
  certificate,
  notes,
}: {
  certificate: Certificate
  notes: CertificateReviewNotes | null
}) => {
  const t = useTranslations('CertificateDetail')

  const kind = certificate.isChangesRequested
    ? 'changes'
    : certificate.isRejected
      ? 'rejected'
      : certificate.isRevoked
        ? 'revoked'
        : null
  if (!kind) return null

  const general = {
    changes: notes?.comment ?? certificate.reviewerComment,
    rejected: certificate.rejectedReason,
    revoked: certificate.revokedReason,
  }[kind]
  const sections =
    kind === 'changes'
      ? CERTIFICATE_SECTIONS.flatMap(section => {
          const text = notes?.sectionComments[section]
          return text ? [{ section, text }] : []
        })
      : []
  if (!general && sections.length === 0) return null

  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <LucideIcon name="message-square" className="size-4" />
          {t(`feedback.${kind}`)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {general && <p className="text-sm whitespace-pre-wrap">{general}</p>}
        {sections.length > 0 && (
          <dl className="flex flex-col gap-3">
            {sections.map(({ section, text }) => (
              <div className="flex flex-col gap-0.5" key={section}>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  {t(`feedback.sections.${section}`)}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">{text}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
