import { cookies } from 'next/headers'

import { type Locale } from 'use-intl'

import { CourseList, type CourseTab } from '@/components/features/course-list'
import { generatePageMetadata } from '@/lib/metadata'
import { Cookie } from '@/lib/storage'

export const generateMetadata = generatePageMetadata({
  title: 'Navigation.courses',
})

export default async () => {
  const { get } = await cookies()
  const localesCookie = get(Cookie.CourseLocales)?.value
  const locales = localesCookie ? (JSON.parse(localesCookie) as Locale[]) : []
  const tab = get(Cookie.CourseSection)?.value as CourseTab

  return <CourseList defaultLocales={locales} defaultTab={tab} />
}
