'use client'

import { redirect } from 'next/navigation'
import { useEffect, useMemo } from 'react'

import { toast } from 'sonner'

import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'
import app from 'config/app.json'

export const CertificateForm = () => {
  const t = useTranslations('Certificates')
  const { courses, organization, user } = useSession()

  const certificate = useMemo(
    () => user.certificates?.find(certificate => certificate.organization.id === organization?.id),
    [user.certificates, organization?.id],
  )
  const hasEnoughCourses = useMemo(() => courses.filter(course => course.completed).length >= app.minSkills, [courses])
  const validCourses = useMemo(
    () =>
      courses.filter(course =>
        course.lessons?.find(
          lesson => lesson.type === 'assessment' && (lesson.assessment?.userRating || 0) >= app.minSkillRating,
        ),
      ),
    [courses],
  )
  const canRequestCertificate = useMemo(
    () => hasEnoughCourses && validCourses.length >= app.minSkills,
    [hasEnoughCourses, validCourses],
  )

  const toastMessage = useMemo(() => {
    if (certificate) return t('alreadyHave')
    if (!canRequestCertificate) return t('cantRequest')
    return null
  }, [canRequestCertificate, certificate, t])

  useEffect(() => {
    if (!toastMessage) return
    toast.error(toastMessage)
    redirect(Route.Certificates)
  })

  return <p>{'new certificate'}</p>
}
