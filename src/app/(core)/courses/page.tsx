import { Suspense } from 'react'

import { createSearchParamsCache, parseAsArrayOf, parseAsInteger, parseAsStringEnum } from 'nuqs/server'

import { CourseListContent } from '@/components/features/courses/course-list/course-list-content'
import { COURSE_LIST_SORTS, COURSE_LIST_TABS } from '@/components/features/courses/course-list/course-list-context'
import { CourseListHeader } from '@/components/features/courses/course-list/course-list-header'
import { CourseListProvider } from '@/components/features/courses/course-list/course-list-provider'
import { CourseListTabs } from '@/components/features/courses/course-list/course-list-tabs'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { COURSE_LIST_PARAMS } from '@/lib/constants'
import { i18n } from '@/lib/i18n'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'courses',
  })

const { parse } = createSearchParamsCache({
  [COURSE_LIST_PARAMS.TAB]: parseAsStringEnum(COURSE_LIST_TABS).withDefault('all'),
  [COURSE_LIST_PARAMS.LANGUAGES]: parseAsArrayOf(parseAsStringEnum(i18n.locales)).withDefault(i18n.locales),
  [COURSE_LIST_PARAMS.SKILL_GROUPS]: parseAsArrayOf(parseAsInteger),
  [COURSE_LIST_PARAMS.SORT]: parseAsStringEnum(COURSE_LIST_SORTS),
  [COURSE_LIST_PARAMS.SORT_DIRECTION]: parseAsStringEnum(['asc', 'desc']).withDefault('asc'),
})

export default async ({ searchParams }: PageProps<'/courses'>) => {
  const params = await parse(searchParams)

  return (
    <Suspense fallback={null}>
      <CourseListProvider value={params}>
        <CourseListTabs>
          <PageHeader className="h-auto flex-wrap" hideLogo>
            <CourseListHeader />
          </PageHeader>
          <PageMain>
            <CourseListContent className="pb-6" />
          </PageMain>
        </CourseListTabs>
      </CourseListProvider>
    </Suspense>
  )
}
