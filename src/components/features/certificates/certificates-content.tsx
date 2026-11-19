'use client'

import { useTranslations } from 'next-intl'

import { type CertificateEligibility } from '@/actions/certificates/queries'
import { CertificateCard } from '@/components/features/certificates/certificate-card'
import { EligibilityPanel } from '@/components/features/certificates/eligibility-panel'
import { FeaturedCredentialCard } from '@/components/features/certificates/featured-credential-card'
import { CERT_LIST_STATUS_VALUES, type CertListStatus } from '@/components/features/certificates/params'
import { CERTIFICATE_STATUS } from '@/components/features/certificates/status'
import { useCertListSort, useCertListStatus } from '@/components/features/certificates/use-params'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FilterRailChips, FilterRailPanel, type FilterRailProps, FilterRailToolbar } from '@/components/ui/filter-rail'
import { Link } from '@/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type Certificate } from '@/db/queries/certificate'

interface CertificatesContentProps {
  certificates: Certificate[]
  eligibility: CertificateEligibility
}

export const CertificatesContent = ({ certificates, eligibility }: CertificatesContentProps) => {
  const t = useTranslations('CertificateList')
  const tStatus = useTranslations('CertificateStatus')
  const tCommon = useTranslations('Common')
  const tDetail = useTranslations('CertificateDetail')
  const { setStatus, status } = useCertListStatus()
  const { setSort, sort } = useCertListSort()

  const { eligible } = eligibility
  const hasCertificates = certificates.length > 0

  const displayCertificates = (() => {
    const filtered = status ? certificates.filter(c => c.status === status) : certificates
    return filtered.toSorted((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sort === 'oldest' ? dateA - dateB : dateB - dateA
    })
  })()

  if (!eligible && !hasCertificates) return <EligibilityPanel eligibility={eligibility} />

  const presentStatuses = CERT_LIST_STATUS_VALUES.filter(value => certificates.some(c => c.status === value))
  const featured = certificates.find(({ isApproved, isDefault }) => isApproved && isDefault)
  const hasOpenRequest = certificates.some(({ isOpen }) => isOpen)

  const rail: FilterRailProps = {
    extra: (
      <div className="flex min-w-0 flex-col gap-2">
        <span className="type-label text-fg-title">{tCommon('sortBy')}</span>
        <Select onValueChange={val => setSort(val as 'newest' | 'oldest')} value={sort}>
          <SelectTrigger aria-label={tCommon('sortBy')} className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('sortNewest')}</SelectItem>
            <SelectItem value="oldest">{t('sortOldest')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    groups: [
      {
        id: 'status',
        label: t('filterStatus'),
        onChange: value => setStatus(value as CertListStatus | null),
        options: presentStatuses.map(value => ({
          count: certificates.filter(c => c.status === value).length,
          label: tStatus(CERTIFICATE_STATUS[value].labelKey),
          tone: CERTIFICATE_STATUS[value].tone,
          value,
        })),
        value: status,
      },
    ],
    onReset: () => setStatus(null),
  }

  return (
    <div className="flex flex-col gap-8">
      {eligible && !hasOpenRequest && (
        <Banner className="flex-wrap items-center justify-between" variant="info">
          <div className="space-y-1">
            <p className="font-semibold text-brand-text">{t('requestCertificateTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('requestCertificateMessage')}</p>
          </div>
          <Button asChild icon="plus" size="sm" variant="brand">
            <Link href="/certificates/new">{t('requestCertificate')}</Link>
          </Button>
        </Banner>
      )}

      {featured && (
        <section aria-labelledby="featured-certificate" className="flex flex-col gap-3">
          <h2 className="type-heading" id="featured-certificate">
            {tDetail('featuredTitle')}
          </h2>
          <Link
            className="group/featured block rounded-xl focus-visible:focus-ring"
            href={`/certificates/${featured.id}`}
          >
            <FeaturedCredentialCard certificate={featured} />
          </Link>
        </section>
      )}

      {hasCertificates && (
        <div className="flex min-w-0 flex-col gap-4 lg:hidden">
          <FilterRailToolbar {...rail} />
        </div>
      )}

      <div className={hasCertificates ? 'flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start' : undefined}>
        {hasCertificates && <FilterRailPanel {...rail} className="max-lg:hidden lg:rounded-xl lg:border" />}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {hasCertificates && <FilterRailChips groups={rail.groups} />}
          {displayCertificates.length > 0 ? (
            <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {displayCertificates.map(cert => (
                <CertificateCard certificate={cert} key={cert.id} />
              ))}
            </div>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {status ? <LucideIcon name="search-x" /> : <LucideIcon name="award" />}
                </EmptyMedia>
                <EmptyTitle>{status ? t('noFilteredCertificates') : t('noCertificates')}</EmptyTitle>
                <EmptyDescription>
                  {status ? t('noFilteredCertificatesMessage') : t('noCertificatesMessage')}
                </EmptyDescription>
              </EmptyHeader>
              {status && (
                <EmptyContent>
                  <Button onClick={() => setStatus(null)} size="sm" variant="outline">
                    {tCommon('clearFilters')}
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          )}
        </div>
      </div>
    </div>
  )
}
