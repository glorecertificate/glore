'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { TranslateDialog } from '@/components/features/courses/course-editor/translate-dialog'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { isTempId } from '@/lib/utils'

export const CourseTranslation = () => {
  const t = useTranslations('CourseTranslate')
  const { currentLesson } = useCourse()
  const [scope, setScope] = useState<'course' | 'lesson' | null>(null)
  const hasLesson = !!currentLesson && currentLesson.id !== undefined && !isTempId(currentLesson.id)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button icon="languages" stable variant="outline">
            {t('open')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasLesson && (
            <DropdownMenuItem onSelect={() => setScope('lesson')}>
              <LucideIcon aria-hidden name="file-text" />
              {t('menu.lesson')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setScope('course')}>
            <LucideIcon aria-hidden name="book-open" />
            {t('menu.course')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TranslateDialog onOpenChange={open => !open && setScope(null)} open={scope !== null} scope={scope ?? 'course'} />
    </>
  )
}
