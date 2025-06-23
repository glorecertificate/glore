'use client'

import { notFound } from 'next/navigation'
import { useEffect } from 'react'

import { type Course } from '@/api/modules/courses/types'
import { CourseEditor } from '@/components/features/courses/course-editor'
import { CourseFlow } from '@/components/features/courses/course-flow'
import { BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { useHeader } from '@/hooks/use-header'
import { useLocale } from '@/hooks/use-locale'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'

export const CourseView = ({ course, type }: { course?: Course; type: 'editor' | 'flow' }) => {
  const { setBreadcrumb, setHeaderShadow } = useHeader()
  const { localize } = useLocale()
  const t = useTranslations('Courses')

  useEffect(() => {
    setHeaderShadow(false)
    setBreadcrumb(
      <BreadcrumbList className="sm:gap-1">
        <BreadcrumbItem title={t('backTo')}>
          <Button asChild variant="ghost">
            <Link href={Route.Courses}>{t('coursesAll')}</Link>
          </Button>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="mr-3" />
        <BreadcrumbItem className="text-foreground">
          {course?.title ? localize(course.title) : t('newCourse')}
        </BreadcrumbItem>
      </BreadcrumbList>,
    )
  }, [course?.title, localize, setBreadcrumb, setHeaderShadow, t])

  if (type === 'editor') return <CourseEditor course={course} />
  if (course) return <CourseFlow course={course} />
  return notFound()
}
