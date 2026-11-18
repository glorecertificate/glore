'use client'

import { useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DEFAULT_LOCALE, localizeRecord } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export const CourseLessonPicker = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const t = useTranslations('CourseEditor')
  const { addLesson, course, currentLesson, language, setStep, step } = useCourse()

  const title = (lessonTitle: Parameters<typeof localizeRecord>[0] | null | undefined) =>
    (lessonTitle && (localizeRecord(lessonTitle, language) || localizeRecord(lessonTitle, DEFAULT_LOCALE))) ||
    t('untitledLesson')

  return (
    <div className={className} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full justify-between" variant="outline">
            <span className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-muted-foreground tabular-nums">{step}</span>
              <span className="truncate">{title(currentLesson.title)}</span>
            </span>
            <LucideIcon aria-hidden name="chevron-down" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
          {course.lessons.map((lesson, index) => (
            <DropdownMenuItem
              className={cn('flex-col items-start gap-0', index + 1 === step && 'bg-accent')}
              key={lesson.id}
              onClick={() => setStep(index + 1)}
            >
              <span className="max-w-full truncate">
                {index + 1}
                {'. '}
                {title(lesson.title)}
              </span>
              <span className="text-xs text-muted-foreground">{t('lessonType', { type: lesson.type })}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => addLesson()}>
            <LucideIcon aria-hidden name="plus" />
            {t('addLesson')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
