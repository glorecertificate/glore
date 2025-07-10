'use client'

import { useMemo } from 'react'

import { BookOpenIcon } from 'lucide-react'

import { type Course } from '@/api/modules/courses/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { useLocale } from '@/hooks/use-locale'
import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { dynamicRoute, Route } from '@/lib/navigation'

export const CourseCard = ({ course }: { course: Course }) => {
  const { localize } = useLocale()
  const { user } = useSession()
  const t = useTranslations()

  const coursePath = useMemo(() => dynamicRoute(Route.Course, { slug: course.slug }), [course.slug])

  const actionLabel = useMemo(() => {
    if (user.canEdit) return t('Courses.editCourse')
    if (!course.enrolled) return t('Courses.startCourse')
    if (course.completed) return t('Courses.reviewCourse')
    return t('Courses.continueCourse')
  }, [course.enrolled, course.completed, t, user.canEdit])

  const progressColor = useMemo(() => (course.completed ? 'success' : 'default'), [course.completed])

  return (
    <Card className="flex h-full flex-col justify-between gap-0 overflow-hidden pt-0">
      <div>
        <div className="relative h-48 w-full overflow-hidden">
          <Link href={coursePath}>
            <div className="absolute inset-0">
              {course.imageUrl && (
                <Image
                  alt={localize(course.title)}
                  className="object-cover transition-all duration-200 hover:scale-110"
                  fill
                  src={course.imageUrl}
                />
              )}
            </div>
          </Link>
        </div>
        <CardHeader className="py-4">
          <h3 className="flex items-center font-semibold">
            <Link className="text-lg" href={coursePath}>
              {localize(course.title)}
            </Link>
            {user.isLearner && course.completed && <span className="ml-0.5 text-success">{' ✔︎'}</span>}
            {/* {user.canEdit && course.publicationStatus === 'draft' && (
              <Badge className="ml-1.5" color="muted" size="xs">
                {t('Courses.draft')}
              </Badge>
            )} */}
          </h3>
          <p className="text-sm text-muted-foreground">{localize(course.description)}</p>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge className="cursor-default text-xs font-normal" color="muted" size="sm" variant="outline">
              <BookOpenIcon className="h-3 w-3" />
              {course.lessons?.length}{' '}
              {t('Common.lessons', {
                count: course.lessons?.length || 0,
              })}
            </Badge>
          </div>
          {course.skill && (
            <Badge className="flex items-center text-[11px]" color="secondary">
              {localize(course.skill.name)}
            </Badge>
          )}
        </CardContent>
      </div>
      <CardFooter className="mt-4 flex-col gap-4">
        {!user.canEdit && course.enrolled && (
          <div className="w-full">
            <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center">
                {course.lessonsCompleted}
                {' / '}
                {course.lessonsCount}{' '}
                {t('Common.lessons', {
                  count: course.lessonsCount,
                })}
              </span>
              <span>
                {course.progress}
                {'% '}
                {t('Common.completed').toLowerCase()}
              </span>
            </div>
            <Progress className="h-1.5" color={progressColor} value={course.progress} />
          </div>
        )}
        <Link className="w-full" href={coursePath}>
          <Button className="w-full dark:hover:bg-background/50" variant="outline">
            {actionLabel}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
