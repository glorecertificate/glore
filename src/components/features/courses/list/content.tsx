'use client'

import type React from 'react'
import { memo, useCallback, useMemo } from 'react'

import { GripVerticalIcon, RotateCcwIcon } from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'

import { reorderCourses } from '@/actions/courses/management'
import { CourseListCard } from '@/components/features/courses/list/card'
import {
  useCourseListFilters,
  useCourseListLanguages,
  useCourseListTab,
  useDisplayCourses,
} from '@/components/features/courses/list/use-params'
import { EmptyListIllustration } from '@/components/illustrations/empty-list'
import { useCourses } from '@/components/providers/courses-context'
import { Button } from '@/components/ui/button'
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from '@/components/ui/sortable'
import { TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Course } from '@/db/queries/course'
import { cn } from '@/lib/utils'

export const CourseListContent = memo(
  ({ className, ...props }: Omit<React.ComponentProps<typeof TabsContent>, 'value'>) => {
    const t = useTranslations('Courses')

    const { setCourses } = useCourses()
    const { tab } = useCourseListTab()
    const { activeLanguages } = useCourseListLanguages()
    const { resetFilters } = useCourseListFilters()
    const { displayCourses, hasFilters, isDefaultView } = useDisplayCourses()

    const isSortable = tab === 'all' && isDefaultView

    const sortCourses = useCallback(
      (orderedCourses: Course[]) => {
        const next = new Map(orderedCourses.map((course, index) => [course.id, index + 1]))

        setCourses(prev => {
          const reordered = orderedCourses.map(course => {
            const previousCourse = new Map(prev.map(c => [c.id, c])).get(course.id)
            const sortOrder = next.get(course.id)
            if (!previousCourse) {
              const { language: _language, ...rest } = course as Course & { language?: Locale }
              return sortOrder ? { ...rest, sortOrder } : rest
            }
            if (!sortOrder || previousCourse.sortOrder === sortOrder) return previousCourse
            return { ...previousCourse, sortOrder }
          })
          const untouched = prev.filter(course => !next.has(course.id))
          return [...reordered, ...untouched]
        })
        reorderCourses(orderedCourses)
      },
      [setCourses]
    )

    const emptyTitle = useMemo(() => {
      switch (tab) {
        case 'published':
        case 'draft':
        case 'archived':
          return t(`emptyTitle-${tab}`)
        default:
          return hasFilters ? t('emptyTitleCommon') : t('emptyTitle')
      }
    }, [t, hasFilters, tab])

    const emptyMessage = useMemo(() => {
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
    }, [t, hasFilters, tab])

    if (displayCourses.length === 0) {
      return (
        <TabsContent className={cn('grow space-y-4', className)} value={tab} {...props}>
          <div className="flex h-full flex-col items-center justify-center gap-8 pb-8 text-center">
            <EmptyListIllustration className="w-68" />
            <div className="flex flex-col items-center gap-1">
              <h3 className="text-xl font-medium">{emptyTitle}</h3>
              <p className="mt-1 text-muted-foreground">
                {emptyMessage}
                {hasFilters && (
                  <>
                    <br />
                    {`${t('updateFilters')}.`}
                  </>
                )}
              </p>
            </div>
          </div>
        </TabsContent>
      )
    }

    if (!isSortable) {
      return (
        <TabsContent className={cn('grow space-y-4', className)} value={tab} {...props}>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {displayCourses.map(course => (
              <div className="group/sortable-item relative h-full" key={course.slug}>
                <CourseListCard
                  activeLanguages={activeLanguages}
                  className="h-full"
                  course={course}
                  key={course.slug}
                />
                {tab === 'all' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="absolute top-6 right-6 flex cursor-not-allowed items-center justify-center rounded-md p-1 opacity-0 transition-opacity group-hover/sortable-item:opacity-50 hover:bg-muted data-[state=delayed-open]:bg-muted data-[state=delayed-open]:opacity-50"
                        disabled
                        type="button"
                      >
                        <GripVerticalIcon className="size-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="flex items-center gap-0.5" sideOffset={10}>
                      {t('reorderDisabled')}
                      <Button className="size-5" onClick={resetFilters} size="text" variant="transparent">
                        <RotateCcwIcon className="size-3" />
                      </Button>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      )
    }

    return (
      <TabsContent className={cn('grow space-y-4', className)} value={tab} {...props}>
        <Sortable getItemValue={item => item.id} onValueChange={sortCourses} orientation="mixed" value={displayCourses}>
          <SortableContent asChild>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {displayCourses.map(course => (
                <SortableItem className="group/sortable-item relative h-full" key={course.slug} value={course.id}>
                  <CourseListCard
                    activeLanguages={activeLanguages}
                    className="h-full"
                    course={course}
                    key={course.slug}
                  />
                  {displayCourses.length > 1 && (
                    <SortableItemHandle
                      className="absolute top-6 right-6 opacity-0 transition-opacity group-hover/sortable-item:opacity-100"
                      title={t('reorderCourse')}
                    >
                      <GripVerticalIcon className="size-4 text-muted-foreground" />
                    </SortableItemHandle>
                  )}
                </SortableItem>
              ))}
            </div>
          </SortableContent>
        </Sortable>
      </TabsContent>
    )
  }
)
