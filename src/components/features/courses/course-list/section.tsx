'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { CourseList } from '@/components/features/courses/course-list'
import { useCourseListRail } from '@/components/features/courses/course-list/rail'
import { CourseListSort } from '@/components/features/courses/course-list/sort'
import { useDisplayCourses } from '@/components/features/courses/course-list/use-params'
import { Button } from '@/components/ui/button'
import { FilterRailChips, FilterRailPanel, FilterRailToolbar } from '@/components/ui/filter-rail'

const PAGE_SIZE = 12

export const CourseListSection = () => {
  const t = useTranslations('CourseList')
  const rail = useCourseListRail()
  const { displayCourses } = useDisplayCourses()
  const [limit, setLimit] = useState(PAGE_SIZE)

  return (
    <div className="flex overflow-hidden rounded-xl border border-border-subtle bg-card shadow-card max-lg:flex-col lg:flex-row">
      <FilterRailPanel {...rail} className="max-lg:hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterRailToolbar {...rail} className="max-sm:contents" />
          <span aria-live="polite" className="text-sm text-muted-foreground max-sm:order-last max-sm:w-full lg:mr-auto">
            {t('showing', { shown: Math.min(limit, displayCourses.length), total: displayCourses.length })}
          </span>
          <CourseListSort className="max-sm:ml-auto" />
        </div>
        <FilterRailChips groups={rail.groups} />
        <CourseList limit={limit} />
        {displayCourses.length > limit && (
          <Button className="self-center" onClick={() => setLimit(limit + PAGE_SIZE)} variant="outline">
            {t('showMore')}
          </Button>
        )}
      </div>
    </div>
  )
}
