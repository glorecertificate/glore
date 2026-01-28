// 'use client'

// import { redirect } from 'next/navigation'
// import { useEffect, useMemo } from 'react'

// import { useTranslations } from 'next-intl'
// import { toast } from 'sonner'

// import config from '~/config/config'

// import { useSession } from '@/components/providers/session-provider'

// export const CertificateForm = () => {
//   const { courses, organization, user } = useSession()
//   const t = useTranslations('Certificates')

//   const certificate = useMemo(
//     () => user.certificates?.find(certificate => certificate.organization.id === organization?.id),
//     [user.certificates, organization?.id]
//   )
//   const hasEnoughCourses = useMemo(
//     () => courses.filter(course => course.completed).length >= config.settings.minSkills,
//     [courses]
//   )
//   const validCourses = useMemo(
//     () =>
//       courses.filter(course =>
//         course.lessons?.find(
//           lesson => lesson.type === 'assessment' && (lesson.assessment?.userRating || 0) >= config.settings.minRating
//         )
//       ),
//     [courses]
//   )
//   const canRequestCertificate = useMemo(
//     () => hasEnoughCourses && validCourses.length >= config.settings.minSkills,
//     [hasEnoughCourses, validCourses.length]
//   )

//   const toastMessage = useMemo(() => {
//     if (certificate) return t('alreadyHave')
//     if (!canRequestCertificate) return t('cantRequest')
//     return null
//   }, [canRequestCertificate, certificate, t])

//   useEffect(() => {
//     if (!toastMessage) return
//     toast.error(toastMessage)
//     redirect('/certificates')
//   })

//   return <p>{'new certificate'}</p>
// }
