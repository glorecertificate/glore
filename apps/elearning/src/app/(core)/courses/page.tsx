import { CourseList } from '@/components/features/course-list'
import { generatePageMetadata } from '@/lib/metadata'
import { getCookie } from '@/lib/server'

export const generateMetadata = generatePageMetadata({
  title: 'Navigation.courses',
})

export default async () => {
  const locales = await getCookie('course-locales')
  const tab = await getCookie('course-tab')

  return <CourseList defaultLocales={locales} defaultTab={tab} />
}
