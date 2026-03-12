'use client'

import { ClipboardCheckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { type Certificate } from '@/db/queries/certificate'
import { useI18n } from '@/hooks/use-i18n'

interface TutorCertificatesContentProps {
  certificates: Certificate[]
}

export const TutorCertificatesContent = ({ certificates }: TutorCertificatesContentProps) => {
  const t = useTranslations('Certificates')
  const { locale } = useI18n()

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  if (certificates.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <ClipboardCheckIcon className="size-7 text-muted-foreground" />
        </div>
        <div className="max-w-sm space-y-2">
          <h2 className="text-lg font-semibold">{t('noAssignedCertificatesTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('noAssignedCertificatesMessage')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-3">
      {certificates.map(cert => (
        <Link href={`/certificates/${cert.id}`} key={cert.id}>
          <Card className="transition-shadow hover:shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                {cert.user ? `${cert.user.firstName} ${cert.user.lastName}` : t('unknownVolunteer')}
              </CardTitle>
              <CardAction>
                <CertificateStatusBadge status={cert.status} />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">{cert.organization.name}</p>
              {cert.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  {t('updatedOn')}: {formatter.format(new Date(cert.updatedAt))}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
