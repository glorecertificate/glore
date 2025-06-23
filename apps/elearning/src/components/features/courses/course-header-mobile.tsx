'use client'

import { useCallback, useMemo } from 'react'

import { ChevronDownIcon } from 'lucide-react'

import { type Course, type Lesson } from '@/api/modules/courses/types'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { useLocale } from '@/hooks/use-locale'
import { useScroll } from '@/hooks/use-scroll'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'

export const CourseHeaderMobile = ({
  course,
  editable = true,
  lesson,
  setStep,
  step,
}: {
  course: Course | Partial<Course>
  editable?: boolean
  lesson?: Lesson | Partial<Lesson>
  setStep: (step: number) => void
  step?: number
}) => {
  const { localize } = useLocale()
  const { scrolled } = useScroll()
  const t = useTranslations('Courses')

  const lessonTitle = useMemo(
    () => (lesson?.title ? localize(lesson.title) : t('newLesson')),
    [lesson?.title, localize, t],
  )
  const progressColor = useMemo(() => (course.progress === 100 ? 'success' : 'default'), [course.progress])

  const isActive = useCallback((index: number) => index === step, [step])
  const isCompleted = useCallback((index: number) => !!course.lessons?.[index].completed, [course.lessons])
  const showCompleted = useCallback((index: number) => !editable && isCompleted(index), [editable, isCompleted])
  const formatLessonType = useCallback(
    (type: string) =>
      t('lessonType', {
        type,
      }),
    [t],
  )

  return (
    <div className={cn('sticky top-[72px] flex flex-col gap-4 bg-background pb-4 md:hidden', scrolled && 'border-b')}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full justify-between py-6" variant="outline">
            <div className="flex flex-col items-start">
              {lesson ? (
                <>
                  <span className="font-medium">{lessonTitle}</span>
                  {lesson.type && (
                    <span className="text-xs text-muted-foreground">{formatLessonType(lesson.type)}</span>
                  )}
                </>
              ) : (
                <span className="font-medium">{'No lessons'}</span>
              )}
            </div>
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {course.lessons ? (
            course.lessons.map((lesson, index) => (
              <DropdownMenuItem className="flex justify-between py-2" key={lesson.id} onClick={() => setStep(index)}>
                <div className="flex flex-col">
                  <span className={cn(isActive(index) && 'font-semibold')}>
                    {localize(lesson.title)}{' '}
                    {showCompleted(index) && <span className="ml-1 text-xs text-success">{'✔︎'}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatLessonType(lesson.type)}</span>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem className="flex justify-between py-2">
              <div className="flex flex-col">
                <span>{'Add lesson'}</span>
              </div>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {course.status !== 'completed' && (
        <div className="flex items-center justify-end gap-2 bg-background md:top-[72px]">
          <span className="text-sm">
            {course.progress}
            {'%'}
          </span>
          <Progress className="md:max-w-sm" color={progressColor} value={course.progress} />
        </div>
      )}
    </div>
  )
}
