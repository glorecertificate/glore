'use client'

import { notFound } from 'next/navigation'
import { useEffect, useMemo } from 'react'

import { type Course } from '@/api/modules/courses/types'
import { CourseEditor } from '@/components/features/course-editor'
import { CourseFlow } from '@/components/features/course-flow'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { useHeader } from '@/hooks/use-header'
import { useLocale } from '@/hooks/use-locale'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'

export const CourseView = ({ course, type }: { course?: Course; type?: 'editor' | 'flow' }) => {
  const { setBreadcrumb, setHeaderShadow } = useHeader()
  const { localize } = useLocale()
  const t = useTranslations('Courses')

  const courseType = useMemo(() => type || (course ? 'flow' : 'editor'), [course, type])

  useEffect(() => {
    setHeaderShadow(false)
    setBreadcrumb(
      <BreadcrumbList className="sm:gap-1">
        <BreadcrumbLink href={Route.Courses} title={t('coursesAll')}>
          {t('title')}
        </BreadcrumbLink>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="text-foreground">
          {course?.title ? localize(course.title) : t('newCourse')}
        </BreadcrumbItem>
      </BreadcrumbList>,
    )
  }, [course?.title, localize, setBreadcrumb, setHeaderShadow, t])

  if (courseType === 'editor') return <CourseEditor course={course} />
  if (course) return <CourseFlow course={course} />
  return notFound()
}
