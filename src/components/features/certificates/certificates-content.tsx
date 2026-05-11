'use client'

import { BookOpenIcon, GraduationCapIcon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type CertificateEligibility } from '@/actions/certificates/queries'
import { CertificateCard } from '@/components/features/certificates/certificate-card'
import { CERT_LIST_STATUS_VALUES, type CertListStatus } from '@/components/features/certificates/params'
import { useCertListSort, useCertListStatus } from '@/components/features/certificates/use-params'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type Certificate } from '@/db/queries/certificate'

interface CertificatesContentProps {
  certificates: Certificate[]
  eligibility: CertificateEligibility
}

const STATUS_LABEL_KEYS: Record<CertListStatus, string> = {
  approved: 'statusApproved',
  changes_requested: 'statusChangesRequested',
  draft: 'statusDraft',
  in_review: 'statusInReview',
  submitted: 'statusSubmitted',
}

export const CertificatesContent = ({ certificates, eligibility }: CertificatesContentProps) => {
  const t = useTranslations('Certificates')
  const { setStatus, status } = useCertListStatus()
  const { setSort, sort } = useCertListSort()

  const { eligible, completedSkillCount, minSkills, minRating, hasLowRatings } = eligibility
  const hasCertificates = certificates.length > 0

  const displayCertificates = (() => {
    const filtered = status ? certificates.filter(c => c.status === status) : certificates
    return filtered.toSorted((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sort === 'oldest' ? dateA - dateB : dateB - dateA
    })
  })()

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

      {hasCertificates && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant={status ? 'ghost' : 'brand'} onClick={() => setStatus(null)}>
              {t('filterAll')}
            </Button>
            {CERT_LIST_STATUS_VALUES.map(s => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? 'brand' : 'ghost'}
                onClick={() => setStatus(status === s ? null : s)}
              >
                {t(STATUS_LABEL_KEYS[s] as Parameters<typeof t>[0])}
              </Button>
            ))}
          </div>
          <Select onValueChange={val => setSort(val as 'newest' | 'oldest')} value={sort}>
            <SelectTrigger className="h-8 w-auto gap-1.5 px-3 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="newest">{t('sortNewest')}</SelectItem>
              <SelectItem value="oldest">{t('sortOldest')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {displayCertificates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayCertificates.map(cert => (
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
