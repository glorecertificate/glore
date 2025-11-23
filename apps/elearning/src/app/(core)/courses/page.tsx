import { redirect } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { CourseList } from '@/components/features/courses/course-list'
import { SectionLayout } from '@/components/layout/section-layout'
import { intlMetadata } from '@/lib/metadata'
import { serverCookies } from '@/lib/storage/server'

export const generateMetadata = intlMetadata({
  title: 'Navigation.courses',
})

export default async () => {
  const { get } = await serverCookies()
  const courseLanguages = get('course_locale')
  const languages = get('course_list_locales')
  const groups = get('course_list_groups')
  const tab = get('course_list_view')
  const user = get('user')
  if (!user) redirect('/login')

  const t = await getTranslations('Courses')
  const description = user.is_admin ? t('descriptionAdmin') : user.is_editor ? t('descriptionEditor') : t('description')

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
