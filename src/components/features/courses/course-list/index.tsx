'use client'

import { GripVerticalIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type Locale, useTranslations } from 'next-intl'

import { reorderCourses } from '@/actions/courses/management'
import { useCourses } from '@/components/features/courses/context'
import { CourseListCard } from '@/components/features/courses/course-list/card'
import {
  useCourseListLanguages,
  useCourseListTab,
  useDisplayCourses,
} from '@/components/features/courses/course-list/use-params'
import { EmptyListIcon } from '@/components/icons/empty-list'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from '@/components/ui/sortable'
import { TabsContent } from '@/components/ui/tabs'
import { type Course } from '@/db/queries/course'
import { cn } from '@/lib/utils'

export const CourseList = ({ className, ...props }: Omit<React.ComponentProps<typeof TabsContent>, 'value'>) => {
  const t = useTranslations('Courses')

  const { setCourses } = useCourses()
  const { tab } = useCourseListTab()
  const { activeLanguages } = useCourseListLanguages()
  const { displayCourses, hasFilters, isDefaultView } = useDisplayCourses()

  const isSortable = tab === 'all' && isDefaultView

  const sortCourses = (orderedCourses: Course[]) => {
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
  }

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

  if (!isSortable) {
    return (
      <TabsContent className={cn('grow space-y-4', className)} value={tab} {...props}>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {displayCourses.map(course => (
              <motion.div
                className="group/sortable-item relative h-full"
                exit={{ opacity: 0, scale: 0.9 }}
                initial={false}
                key={course.slug}
                layout
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <CourseListCard activeLanguages={activeLanguages} className="h-full" course={course} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </TabsContent>
    )
  }

  return (
    <TabsContent className={cn('grow space-y-4', className)} value={tab} {...props}>
      <Sortable getItemValue={item => item.id} onValueChange={sortCourses} orientation="mixed" value={displayCourses}>
        <SortableContent asChild>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence>
              {displayCourses.map(course => (
                <SortableItem
                  asChild
                  className="group/sortable-item relative h-full"
                  key={course.slug}
                  value={course.id}
                >
                  <motion.div exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                    <CourseListCard activeLanguages={activeLanguages} className="h-full" course={course} />
                    {displayCourses.length > 1 && (
                      <SortableItemHandle
                        className="absolute top-6 right-6 opacity-0 transition-opacity group-hover/sortable-item:opacity-100"
                        title={t('reorderCourse')}
                      >
                        <GripVerticalIcon className="size-4 text-muted-foreground" />
                      </SortableItemHandle>
                    )}
                  </motion.div>
                </SortableItem>
              ))}
            </AnimatePresence>
          </div>
        </SortableContent>
      </Sortable>
    </TabsContent>
  )
}
