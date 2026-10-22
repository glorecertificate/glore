'use client'

import { GripVerticalIcon } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { reorderCourses } from '@/actions/courses/management'
import { useCourses } from '@/components/features/courses/context'
import { CourseListCard } from '@/components/features/courses/course-list/card'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  animateLayoutChangesAlways,
  measureAlways,
} from '@/components/ui/sortable'
import { type Course } from '@/db/queries/course'

interface CourseListSortableGridProps {
  activeLanguages: Locale[]
  courses: Course[]
}

export const CourseListSortableGrid = ({ activeLanguages, courses }: CourseListSortableGridProps) => {
  const t = useTranslations('Courses')
  const tEditor = useTranslations('Learning.editor')
  const { courses: allCourses, setCourses } = useCourses()
  const reducedMotion = useReducedMotion()

  const sortCourses = async (orderedCourses: Course[]) => {
    const snapshot = allCourses
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
    try {
      await reorderCourses(orderedCourses)
    } catch {
      setCourses(snapshot)
      toast.error(tEditor('reorderFailed'))
    }
  }

  return (
    <Sortable
      getItemValue={item => item.id}
      measuring={measureAlways}
      onValueChange={sortCourses}
      orientation="mixed"
      value={courses}
    >
      <SortableContent asChild>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatedList>
            {courses.map(course => (
              <SortableItem
                animateLayoutChanges={reducedMotion ? undefined : animateLayoutChangesAlways}
                asChild
                className="group/sortable-item relative h-full"
                key={course.slug}
                value={course.id}
              >
                <AnimatedListItem exitOnly>
                  <CourseListCard activeLanguages={activeLanguages} className="h-full" course={course} />
                  {courses.length > 1 && (
                    <SortableItemHandle
                      className="absolute top-6 right-6 opacity-0 transition-opacity group-hover/sortable-item:opacity-100"
                      title={t('reorderCourse')}
                    >
                      <GripVerticalIcon className="size-4 text-muted-foreground" />
                    </SortableItemHandle>
                  )}
                </AnimatedListItem>
              </SortableItem>
            ))}
          </AnimatedList>
        </div>
      </SortableContent>
    </Sortable>
  )
}
