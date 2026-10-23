'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { listOrganizationCertificates } from '@/actions/certificates/queries'
import { listOrgTutors } from '@/actions/organizations/queries'
import { type OrgTutor } from '@/components/features/certificates/certificate-reviewer'
import { OrganizationCertificates } from '@/components/features/certificates/organization-certificates'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { type Certificate } from '@/db/queries/certificate'

interface LoadedCertificates {
  certificates: Certificate[]
  tutors: OrgTutor[]
}

const fetchCertificates = async (organizationId: number): Promise<LoadedCertificates | null> => {
  const [certificates, tutors] = await Promise.all([
    listOrganizationCertificates(organizationId),
    listOrgTutors(organizationId),
  ])
  if (certificates.data === null || certificates.error || tutors.error) return null
  return { certificates: certificates.data ?? [], tutors: tutors.data ?? [] }
}

export const OrganizationCertificatesPanel = ({ organizationId }: { organizationId: number }) => {
  const [attempt, setAttempt] = useState(0)

  return (
    <CertificatesContent
      key={`${organizationId}-${attempt}`}
      onRetry={() => setAttempt(current => current + 1)}
      organizationId={organizationId}
    />
  )
}

const CertificatesContent = ({ onRetry, organizationId }: { onRetry: () => void; organizationId: number }) => {
  const t = useTranslations('Organization')
  const [loaded, setLoaded] = useState<LoadedCertificates | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      const next = await fetchCertificates(organizationId)
      if (!active) return
      setFailed(!next)
      setLoaded(next)
    }
    load()
    return () => {
      active = false
    }
  }, [organizationId])

  const reload = async () => {
    const next = await fetchCertificates(organizationId)
    if (next) setLoaded(next)
  }

  if (failed) {
    return (
      <Banner className="items-center justify-between" role="alert" variant="destructive">
        {t('certificatesError')}
        <Button onClick={onRetry} size="sm" type="button" variant="outline">
          {t('retry')}
        </Button>
      </Banner>
    )
  }

  if (!loaded) {
    return (
      <div aria-busy className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map(index => (
            <Skeleton className="h-24 w-full" key={index} />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <OrganizationCertificates
      certificates={loaded.certificates}
      onChanged={() => void reload()}
      tutors={loaded.tutors}
    />
  )
}
