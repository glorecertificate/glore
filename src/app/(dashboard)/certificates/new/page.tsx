// 'use client'

// Import { redirect } from 'next/navigation'
// Import { useEffect, useMemo } from 'react'

// Import { useTranslations } from 'next-intl'
// Import { toast } from 'sonner'

// Import config from '~/config/config'

// Import { useSession } from '@/components/providers/session-provider'

// Export default () => {
//   Const { courses, organization, user } = useSession()
//   Const t = useTranslations('Certificates')

//   Const certificate = useMemo(
//     () => user.certificates?.find(certificate => certificate.organization.id === organization?.id),
//     [user.certificates, organization?.id]
//   )
//   Const hasEnoughCourses = useMemo(
//     () => courses.filter(course => course.completed).length >= config.settings.minSkills,
//     [courses]
//   )
//   Const validCourses = useMemo(
//     () =>
//       Courses.filter(course =>
//         Course.lessons?.find(
//           Lesson => lesson.type === 'assessment' && (lesson.assessment?.userRating || 0) >= config.settings.minRating
//         )
//       ),
//     [courses]
//   )
//   Const canRequestCertificate = useMemo(
//     () => hasEnoughCourses && validCourses.length >= config.settings.minSkills,
//     [hasEnoughCourses, validCourses.length]
//   )

//   Const toastMessage = useMemo(() => {
//     If (certificate) return t('alreadyHave')
//     If (!canRequestCertificate) return t('cantRequest')
//     Return null
//   }, [canRequestCertificate, certificate, t])

//   UseEffect(() => {
//     If (!toastMessage) return
//     Toast.error(toastMessage)
//     Redirect('/certificates')
//   })

//   Return <p>{'New certificate'}</p>
// }

export default () => null
