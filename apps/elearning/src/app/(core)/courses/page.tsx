import { getTranslations } from 'next-intl/server'

import { CourseList } from '@/components/features/courses/course-list'
import { SectionLayout } from '@/components/layout/section-layout'
import { createMetadata } from '@/lib/metadata'
import { serverCookies } from '@/lib/storage/server'

export const metadata = createMetadata({
  title: 'courses',
})

export default async () => {
  const { get } = await serverCookies()
  const courseLanguages = get('course_locale')
  const languages = get('course_list_locales')
  const groups = get('course_list_groups')
  const tab = get('course_list_view')
  const user = get('user')
  if (!user) throw new Error('Unauthorized')

  const t = await getTranslations('Courses')
  const description = user.isAdmin ? t('descriptionAdmin') : user.isEditor ? t('descriptionEditor') : t('description')

  return (
    <SectionLayout className="gap-4" description={description} title={t('title')}>
      <CourseList
        defaultCourseLanguage={courseLanguages}
        defaultGroups={groups}
        defaultLanguages={languages}
        defaultTab={tab}
      />
    </SectionLayout>
  )
}
