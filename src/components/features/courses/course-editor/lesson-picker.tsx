'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { CourseSidebar } from '@/components/features/courses/course-editor/sidebar'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DEFAULT_LOCALE, localizeRecord } from '@/lib/i18n'

const BODY_STYLE = { paddingBottom: 'env(safe-area-inset-bottom)' }

export const CourseLessonPicker = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const t = useTranslations('CourseEditor')
  const tCommon = useTranslations('Components.Dialog')
  const { course, currentLesson, language, step } = useCourse()
  const [open, setOpen] = useState(false)

  const lessonTitle = currentLesson.title
  const title =
    (lessonTitle && (localizeRecord(lessonTitle, language) || localizeRecord(lessonTitle, DEFAULT_LOCALE))) ||
    t('untitledLesson')

  return (
    <div className={className} {...props}>
      <Button className="w-full justify-between" onClick={() => setOpen(true)} variant="outline">
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-muted-foreground tabular-nums">{step}</span>
          <span className="truncate">{title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
          <span className="text-xs tabular-nums">{`${step}/${course.lessons.length}`}</span>
          <LucideIcon aria-hidden name="chevron-down" />
        </span>
      </Button>
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent
          className="max-h-4/5 gap-0 overflow-hidden rounded-t-xl p-0"
          closeSrText={tCommon('close')}
          side="bottom"
        >
          <SheetHeader className="border-b px-4 py-3 pr-12">
            <SheetTitle className="flex items-center gap-2">
              {t('lessonsTitle')}
              <span className="type-caption text-muted-foreground tabular-nums">{course.lessons.length}</span>
            </SheetTitle>
            <SheetDescription className="sr-only">{t('lessonsSheetDescription')}</SheetDescription>
          </SheetHeader>
          <div style={BODY_STYLE} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3 pr-2 pl-9">
            <CourseSidebar onChoose={() => setOpen(false)} variant="sheet" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
