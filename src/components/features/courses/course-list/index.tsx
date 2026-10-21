'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

import { useTranslations } from 'next-intl'

import { CourseListCard } from '@/components/features/courses/course-list/card'
import {
  useCourseListLanguages,
  useCourseListTab,
  useDisplayCourses,
} from '@/components/features/courses/course-list/use-params'
import { EmptyListIcon } from '@/components/icons/empty-list'
import { useSession } from '@/components/providers/session'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const CourseListSortableGrid = dynamic(
  async () => (await import('@/components/features/courses/course-list/sortable-grid')).CourseListSortableGrid
)

export const CourseList = ({ className, ...props }: Omit<React.ComponentProps<typeof TabsContent>, 'value'>) => {
  const t = useTranslations('Courses')
  const { user } = useSession()
  const { tab } = useCourseListTab()
  const { activeLanguages } = useCourseListLanguages()
  const { displayCourses, hasFilters, isDefaultView } = useDisplayCourses()

  const emptyTitle = (() => {
    switch (tab) {
      case 'published':
      case 'draft':
      case 'archived':
        return t(`emptyTitle-${tab}`)
      default:
        return hasFilters ? t('emptyTitleCommon') : t('emptyTitle')
    }
  })()

  const emptyMessage = (() => {
    switch (tab) {
      case 'published':
      case 'draft':
      case 'archived':
        return hasFilters
          ? t.markup('withFilters', { message: t(`emptyMessage-${tab}`) })
          : t('atTheMoment', { message: t(`emptyMessage-${tab}`) })
      case 'notStarted':
      case 'inProgress':
      case 'completed':
        return t(`emptyMessage-${tab}`)
      default:
        return t('emptyMessage')
    }
  })()

  if (displayCourses.length === 0) {
    return (
      <TabsContent className={cn('grow space-y-4', className)} value={tab} {...props}>
        <Empty className="h-full pb-8">
          <EmptyHeader className="max-w-md gap-3">
            <EmptyMedia>
              <EmptyListIcon className="w-68" />
            </EmptyMedia>
            <EmptyTitle className="text-xl">{emptyTitle}</EmptyTitle>
            <EmptyDescription>
              {emptyMessage}
              {hasFilters && (
                <>
                  <br />
                  {`${t('updateFilters')}.`}
                </>
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </TabsContent>
    )
  }

  const grid = (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <AnimatedList>
        {displayCourses.map(course => (
          <AnimatedListItem className="group/sortable-item relative h-full" key={course.slug}>
            <CourseListCard activeLanguages={activeLanguages} className="h-full" course={course} />
          </AnimatedListItem>
        ))}
      </AnimatedList>
    </div>
  )

  if (!(user.canEdit && tab === 'all' && isDefaultView)) {
    return (
      <TabsContent className={cn('grow space-y-4', className)} value={tab} {...props}>
        {grid}
      </TabsContent>
    )
  }

  return (
    <TabsContent className={cn('grow space-y-4', className)} value={tab} {...props}>
      <Suspense fallback={grid}>
        <CourseListSortableGrid activeLanguages={activeLanguages} courses={displayCourses} />
      </Suspense>
    </TabsContent>
  )
}
