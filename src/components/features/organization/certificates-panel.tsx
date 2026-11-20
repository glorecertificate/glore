'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { listOrganizationCertificates } from '@/actions/certificates/queries'
import { listOrgTutors } from '@/actions/organizations/queries'
import { type OrgTutor } from '@/components/features/certificates/certificate-reviewer'
import { OrganizationCertificates } from '@/components/features/certificates/organization-certificates'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { type Certificate } from '@/db/queries/certificate'

import { type InsightsScope, createInsightsCache } from './insights-cache'

interface LoadedCertificates {
  certificates: Certificate[]
  tutors: OrgTutor[]
}

const fetchCertificates = async (organizationId: number, cache = true): Promise<LoadedCertificates | null> => {
  const [certificates, tutors] = await Promise.all([
    listOrganizationCertificates(organizationId, { cache }),
    listOrgTutors(organizationId),
  ])
  if (certificates.data === null || certificates.error || tutors.error) return null
  return { certificates: certificates.data ?? [], tutors: tutors.data ?? [] }
}

const certificatesCache = createInsightsCache<LoadedCertificates>(organizationId => fetchCertificates(organizationId))

export const prefetchCertificates = (scope: InsightsScope) => certificatesCache.prefetch(scope)

export const OrganizationCertificatesPanel = ({
  organizationId,
  viewerId,
}: {
  organizationId: number
  viewerId?: string
}) => {
  const [attempt, setAttempt] = useState(0)

  return (
    <CertificatesContent
      key={`${organizationId}-${attempt}`}
      onRetry={() => setAttempt(current => current + 1)}
      organizationId={organizationId}
      viewerId={viewerId}
    />
  )
}

const CertificatesContent = ({
  onRetry,
  organizationId,
  viewerId,
}: {
  onRetry: () => void
  organizationId: number
  viewerId?: string
}) => {
  const t = useTranslations('Organization')
  const scope = { organizationId, userId: viewerId ?? '' }
  const [fetched, setFetched] = useState<LoadedCertificates | null>(() => certificatesCache.read(scope))
  const [failed, setFailed] = useState(false)
  const loaded = fetched ?? certificatesCache.read(scope)

  useEffect(() => {
    if (loaded) return
    let active = true
    const load = async () => {
      await certificatesCache.prefetch({ organizationId, userId: viewerId ?? '' })
      const next = certificatesCache.read({ organizationId, userId: viewerId ?? '' })
      if (!active) return
      setFailed(!next)
      setFetched(next)
    }
    load()
    return () => {
      active = false
    }
  }, [loaded, organizationId, viewerId])

  const reload = async () => {
    certificatesCache.invalidate()
    const next = await fetchCertificates(organizationId, false)
    if (next) setFetched(next)
  }

  if (failed) {
    return (
      <div className="flex flex-col gap-6">
        <Banner className="items-center justify-between" role="alert" variant="destructive">
          {t('certificatesError')}
          <Button onClick={onRetry} size="sm" type="button" variant="outline">
            {t('retry')}
          </Button>
        </Banner>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {loaded ? (
        <OrganizationCertificates
          certificates={loaded.certificates}
          onChanged={() => void reload()}
          tutors={loaded.tutors}
        />
      ) : (
        <OrganizationCertificates certificates={[]} loading tutors={[]} />
      )}
    </div>
  )
}
