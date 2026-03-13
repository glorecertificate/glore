import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCookie } from '@/actions/cookies'
import { CourseListContent } from '@/components/features/courses/list/content'
import { CourseListHeader } from '@/components/features/courses/list/header'
import { CourseListSkeleton } from '@/components/features/courses/list/skeleton'
import { CourseListTabs } from '@/components/features/courses/list/tabs'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'courses',
  })

export default async ({ searchParams }: PageProps<'/courses'>) => {
  if (Object.keys(await searchParams).length === 0) {
    const params = await getCookie('courseListParams')
    if (params) {
      redirect(`/courses?${params}`)
    }
  }

  return (
    <Suspense fallback={<CourseListSkeleton />}>
      <CourseListTabs>
        <CourseListHeader />
        <PageMain className="min-h-[calc(100vh-160px)]">
          <CourseListContent className="pb-6" />
        </PageMain>
      </CourseListTabs>
    </Suspense>
  )
}
