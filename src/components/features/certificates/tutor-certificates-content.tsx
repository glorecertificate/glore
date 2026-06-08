'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { ClipboardCheckIcon, UserPlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { selfAssignCertificate } from '@/actions/certificates/management'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Link } from '@/components/ui/link'
import { type Certificate } from '@/db/queries/certificate'
import { useI18n } from '@/hooks/use-i18n'

interface TutorCertificatesContentProps {
  assigned: Certificate[]
  unassigned: Certificate[]
}

export const TutorCertificatesContent = ({ assigned, unassigned }: TutorCertificatesContentProps) => {
  const t = useTranslations('Certificates')
  const { refresh } = useRouter()
  const { locale } = useI18n()
  const [isPending, startTransition] = useTransition()

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  const handleSelfAssign = (certId: number) => {
    startTransition(async () => {
      const { error } = await selfAssignCertificate(certId)
      if (error) {
        toast.error(t('selfAssignError'))
        return
      }
      toast.success(t('selfAssignSuccess'))
      refresh()
    })
  }

  if (assigned.length === 0 && unassigned.length === 0) {
    return (
      <Empty className="flex-1 py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardCheckIcon />
          </EmptyMedia>
          <EmptyTitle>{t('noAssignedCertificatesTitle')}</EmptyTitle>
          <EmptyDescription>{t('noAssignedCertificatesMessage')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-6">
      {assigned.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assigned.map(cert => (
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
                        {t('updatedOn')}
                        {': '}
                        {formatter.format(new Date(cert.updatedAt))}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {unassigned.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{t('unassignedCertificatesTitle')}</h3>
            <p className="text-xs text-muted-foreground">{t('unassignedCertificatesMessage')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unassigned.map(cert => (
              <Card key={cert.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {cert.user ? `${cert.user.firstName} ${cert.user.lastName}` : t('unknownVolunteer')}
                  </CardTitle>
                  <CardAction>
                    <CertificateStatusBadge status={cert.status} />
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">{cert.organization.name}</p>
                    {cert.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        {t('submittedOn')}
                        {': '}
                        {formatter.format(new Date(cert.createdAt))}
                      </p>
                    )}
                  </div>
                  <Button
                    disabled={isPending}
                    icon={UserPlusIcon}
                    onClick={() => handleSelfAssign(cert.id)}
                    size="sm"
                    variant="outline"
                  >
                    {t('selfAssign')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
