import { CourseList } from '@/components/features/courses/course-list'
import { createMetadata } from '@/lib/metadata'
import { getCookie } from '@/lib/storage/server'

export const generateMetadata = createMetadata({
  title: 'Navigation.courses',
})

export default async () => {
  const locales = await getCookie('course-locales')
  const tab = await getCookie('course-tab')

  return <CourseList defaultLanguages={locales} defaultTab={tab} />
}
