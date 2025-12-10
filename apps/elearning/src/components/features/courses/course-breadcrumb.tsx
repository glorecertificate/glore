'use client'

import { useCallback, useEffect, useState } from 'react'

import type { IconName } from 'lucide-react/dynamic'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useCourse } from '@/components/features/courses/course-provider'
import { DynamicIcon } from '@/components/icons/dynamic'
import { useSession } from '@/components/providers/session-provider'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { InlineInput } from '@/components/ui/inline-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePortal } from '@/hooks/use-portal'
import { localize } from '@/lib/i18n'

export const CourseBreadcrumb = () => {
  const Breadcrumb = usePortal('breadcrumb')
  const t = useTranslations('Courses')

  const { user } = useSession()
  const { course, language, setCourse, setSettingsOpen } = useCourse()

  const title = localize(course.title, language)
  const [draftTitle, setDraftTitle] = useState(title)
  const [titleFocused, setTitleFocused] = useState(false)

  useEffect(() => {
    setDraftTitle(title)
  }, [title])

  const onTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      if (value.length > 100) {
        toast.warning(t('titleTooLong'), { duration: 4000 })
      }
      setDraftTitle(value.slice(0, 100))
    },
    [t]
  )

  const onTitleFocus = useCallback(() => {
    setTitleFocused(true)
  }, [])

  const onTitleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setTitleFocused(false)
      if (e.target.value.trim() === title) return
      if (e.target.value.trim() === '') return setDraftTitle(title)
      setCourse(currentCourse => ({
        ...currentCourse,
        title: {
          ...currentCourse.title,
          [language]: e.target.value,
        },
      }))
    },
    [language, setCourse, title]
  )

  return (
    <Breadcrumb>
      <BreadcrumbList className="grow sm:gap-1.5">
        <BreadcrumbLink href="/courses" title={t('backToAll')} variant="link">
          {t('courses')}
        </BreadcrumbLink>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="grow gap-2 pr-6 text-foreground/80">
          {course.icon && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="p-0"
                  disabled={!user.canEdit}
                  onClick={() => setSettingsOpen(true)}
                  size="text"
                  variant="ghost"
                >
                  <DynamicIcon
                    className="size-4.5 shrink-0 text-muted-foreground/80 dark:text-foreground/80"
                    name={course.icon as IconName}
                  >
                    <Skeleton className="size-4.5 shrink-0" />
                  </DynamicIcon>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                {t('updateIcon')}
              </TooltipContent>
            </Tooltip>
          )}
          {user.canEdit ? (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <InlineInput
                  className="px-1 py-0.5"
                  defaultValue={title}
                  onBlur={onTitleBlur}
                  onChange={onTitleChange}
                  onFocus={onTitleFocus}
                  value={draftTitle}
                />
              </TooltipTrigger>
              {!titleFocused && (
                <TooltipContent side="bottom" sideOffset={4} size="sm">
                  {t('renameCourse')}
                </TooltipContent>
              )}
            </Tooltip>
          ) : (
            title
          )}
          {user.canEdit && course.archived_at && <Badge size="sm">{t('archived')}</Badge>}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
