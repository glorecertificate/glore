'use client'

import { type AppRoutes } from 'next/types/routes'
import { useMemo } from 'react'

import { useTranslations } from 'next-intl'

import config from '@config/app'

import { CertificateDocument } from '@/components/features/certificates/certificate-document'
import { CertificateGraphic } from '@/components/graphics/certificate'
import { NoAccessGraphic } from '@/components/graphics/no-access'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { useSession } from '@/hooks/use-session'

export const CertificateView = () => {
  const { courses, organization, user } = useSession()
  const t = useTranslations('Certificates')

  const certificate = useMemo(
    () => user.certificates?.find(certificate => certificate.organization.id === organization?.id),
    [user.certificates, organization?.id]
  )

  const hasEnoughCourses = useMemo(
    () => courses.filter(course => course.completed).length >= config.minSkills,
    [courses]
  )
  const validCourses = useMemo(
    () =>
      courses.filter(course =>
        course.lessons?.find(
          lesson => lesson.type === 'assessment' && (lesson.assessment?.userRating || 0) >= config.minSkillRating
        )
      ),
    [courses]
  )
  const canRequestCertificate = useMemo(
    () => hasEnoughCourses && validCourses.length >= config.minSkills,
    [hasEnoughCourses, validCourses.length]
  )

  const NoCertificateImage = useMemo(
    () =>
      canRequestCertificate ? (
        <CertificateGraphic className="mx-auto mb-6" width={300} />
      ) : (
        <NoAccessGraphic className="mx-auto mb-0" width={220} />
      ),
    [canRequestCertificate]
  )
  const noCertificateTitle = useMemo(
    () =>
      canRequestCertificate
        ? t('requestCertificateTitle')
        : hasEnoughCourses
          ? t('invalidCoursesTitle')
          : t('missingCoursesTitle'),
    [canRequestCertificate, hasEnoughCourses, t]
  )
  const noCertificateMessage = useMemo(
    () =>
      canRequestCertificate
        ? t('requestCertificateMessage')
        : hasEnoughCourses
          ? t('invalidCoursesMessage', { rating: String(config.minSkillRating) })
          : t('missingCoursesMessage', { count: String(config.minSkills) }),
    [canRequestCertificate, hasEnoughCourses, t]
  )
  const noCertificateLabel = useMemo(
    () => (canRequestCertificate ? t('requestCertificate') : t('goToCourses')),
    [canRequestCertificate, t]
  )
  const noCertificateLink = useMemo<AppRoutes>(
    () => (canRequestCertificate ? '/certificates/new' : '/courses'),
    [canRequestCertificate]
  )

  return (
    <>
      <div className="border-b">
        <div className="container pb-4">
          <h1 className="mb-2 font-bold text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <div className="container flex-1 py-6">
        {certificate ? (
          <CertificateDocument certificate={certificate} />
        ) : (
          <div className="mx-auto max-w-xl py-12 text-center">
            {NoCertificateImage}
            <h2 className="mb-2 font-bold text-lg">{noCertificateTitle}</h2>
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
