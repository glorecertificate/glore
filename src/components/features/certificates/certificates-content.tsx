'use client'

import { BookOpenIcon, GraduationCapIcon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type CertificateEligibility } from '@/actions/certificate'
import { CertificateCard } from '@/components/features/certificates/certificate-card'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { type Certificate } from '@/db/queries/certificate'

interface CertificatesContentProps {
  certificates: Certificate[]
  eligibility: CertificateEligibility
}

export const CertificatesContent = ({ certificates, eligibility }: CertificatesContentProps) => {
  const t = useTranslations('Certificates')

  const { eligible, completedSkillCount, minSkills, minRating, hasLowRatings } = eligibility
  const hasCertificates = certificates.length > 0

  if (!eligible && !hasCertificates) {
    const titleKey = completedSkillCount < minSkills ? 'missingCoursesTitle' : 'invalidCoursesTitle'
    const messageKey = completedSkillCount < minSkills ? 'missingCoursesMessage' : 'invalidCoursesMessage'
    const messageParams = completedSkillCount < minSkills ? { count: minSkills } : { rating: minRating }

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          {hasLowRatings ? (
            <GraduationCapIcon className="size-7 text-muted-foreground" />
          ) : (
            <BookOpenIcon className="size-7 text-muted-foreground" />
          )}
        </div>
        <div className="max-w-sm space-y-2">
          <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
          <p className="text-sm text-muted-foreground">
            {t(messageKey, messageParams as unknown as Record<string, string | number>)}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/courses">{t('goToCourses')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-6">
      {eligible && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-brand/30 bg-brand/5 p-5">
          <div className="space-y-1">
            <p className="font-semibold text-brand">{t('requestCertificateTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('requestCertificateMessage')}</p>
          </div>
          <Button asChild icon={PlusIcon} size="sm" variant="brand">
            <Link href="/certificates/new">{t('requestCertificate')}</Link>
          </Button>
        </div>
      )}

      {hasCertificates ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map(cert => (
            <Link href={`/certificates/${cert.id}`} key={cert.id}>
              <CertificateCard certificate={cert} />
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('noCertificates')}</p>
      )}
    </div>
  )
}
