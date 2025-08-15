'use client'

import { useMemo } from 'react'

import { CertificateDocument } from '@/components/features/certificates/certificate-document'
import { Button } from '@/components/ui/button'
import { CertificateGraphic } from '@/components/ui/graphics/certificate'
import { NoAccessGraphic } from '@/components/ui/graphics/no-access'
import { Link } from '@/components/ui/link'
import { useConfig } from '@/hooks/use-config'
import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'

export const CertificateView = () => {
  const { minSkillRating, minSkills } = useConfig()
  const { courses, organization, user } = useSession()
  const t = useTranslations('Certificates')

  const certificate = useMemo(
    () => user.certificates?.find(certificate => certificate.organization.id === organization?.id),
    [user.certificates, organization?.id],
  )

  const hasEnoughCourses = useMemo(
    () => courses.filter(course => course.completed).length >= minSkills,
    [courses, minSkills],
  )
  const validCourses = useMemo(
    () =>
      courses.filter(course =>
        course.lessons?.find(
          lesson => lesson.type === 'assessment' && (lesson.assessment?.userRating || 0) >= minSkillRating,
        ),
      ),
    [courses, minSkillRating],
  )
  const canRequestCertificate = useMemo(
    () => hasEnoughCourses && validCourses.length >= minSkills,
    [hasEnoughCourses, minSkills, validCourses.length],
  )

  const NoCertificateImage = useMemo(
    () =>
      canRequestCertificate ? (
        <CertificateGraphic className="mx-auto mb-6" width={300} />
      ) : (
        <NoAccessGraphic className="mx-auto mb-0" width={220} />
      ),
    [canRequestCertificate],
  )
  const noCertificateTitle = useMemo(
    () =>
      canRequestCertificate
        ? t('requestCertificateTitle')
        : hasEnoughCourses
          ? t('invalidCoursesTitle')
          : t('missingCoursesTitle'),
    [canRequestCertificate, hasEnoughCourses, t],
  )
  const noCertificateMessage = useMemo(
    () =>
      canRequestCertificate
        ? t('requestCertificateMessage')
        : hasEnoughCourses
          ? t('invalidCoursesMessage', { rating: String(minSkillRating) })
          : t('missingCoursesMessage', { count: String(minSkills) }),
    [canRequestCertificate, hasEnoughCourses, minSkillRating, minSkills, t],
  )
  const noCertificateLabel = useMemo(
    () => (canRequestCertificate ? t('requestCertificate') : t('goToCourses')),
    [canRequestCertificate, t],
  )
  const noCertificateLink = useMemo(
    () => (canRequestCertificate ? Route.CertificateNew : Route.Courses),
    [canRequestCertificate],
  )

  return (
    <>
      <div className="border-b">
        <div className="container pb-4">
          <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <div className="container flex-1 py-6">
        {certificate ? (
          <CertificateDocument certificate={certificate} />
        ) : (
          <div className="mx-auto max-w-xl py-12 text-center">
            {NoCertificateImage}
            <h2 className="mb-2 text-lg font-bold">{noCertificateTitle}</h2>
            <p className="mb-5 text-muted-foreground">{noCertificateMessage}</p>
            <Button asChild size="lg" variant="brand">
              <Link href={noCertificateLink}>{noCertificateLabel}</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
