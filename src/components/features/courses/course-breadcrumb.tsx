'use client'

import { useCallback, useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useCourse } from '@/components/features/courses/course-context'
import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { IconPicker } from '@/components/ui/icon-picker'
import { InlineInput } from '@/components/ui/inline-input'
import { Link } from '@/components/ui/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSession } from '@/hooks/use-session'
import { localizeRecord } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export const CourseBreadcrumb = () => {
  const t = useTranslations('Courses')
  const { user } = useSession()
  const { course, languageStatus, language, editCourse, setCourse } = useCourse()

  const title = localizeRecord(course.title, language)
  const [draftTitle, setDraftTitle] = useState(title)
  const [titleFocused, setTitleFocused] = useState(false)

  useEffect(() => {
    setDraftTitle(title)
  }, [title])

  const onTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { value } = e.target
      if (value.length > 100) {
        toast.warning(t('titleTooLong'))
      }
      setDraftTitle(value.slice(0, 100))
    },
    [t]
  )

  const onTitleFocus = useCallback(() => {
    setTitleFocused(true)
  }, [])

  const onTitleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
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
      <BreadcrumbList className="grow">
        <BreadcrumbItem>
          <Button
            asChild
            className="flex h-8 items-center gap-1.5 text-[15px] text-muted-foreground/80 leading-[inherit] hover:text-foreground! dark:text-foreground/80"
            size="text"
            title={t('backToAll')}
            variant="transparent"
          >
            <Link href="/courses">{t('courses')}</Link>
          </Button>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem className="grow gap-2 pr-6">
          {user.canEdit && !course.archived_at ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconPicker
                    categorized={false}
                    className="h-4 w-4 shrink-0 text-muted-foreground/80 hover:text-foreground! dark:text-foreground/80 dark:hover:text-foreground! [&>svg]:size-4.5!"
                    defaultValue={course.icon}
                    fallback={<Skeleton className="h-4 w-4 rounded-md bg-foreground/15" />}
                    onValueChange={icon => editCourse({ icon })}
                    size="text"
                    variant="transparent"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} size="sm">
                  {t('updateIcon')}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <InlineInput
                    autoWidth
                    className={cn(
                      'px-1 py-0.5 text-[14.5px] text-foreground/90 hover:text-foreground focus:text-foreground',
                      !titleFocused &&
                        languageStatus.hasTitleUpdates &&
                        'decoration-2 decoration-warning decoration-dotted underline-offset-4'
                    )}
                    defaultValue={title}
                    onBlur={onTitleBlur}
                    onChange={onTitleChange}
                    onFocus={onTitleFocus}
                    rows={1}
                    value={draftTitle}
                  />
                </TooltipTrigger>
                {!titleFocused && (
                  <TooltipContent side="bottom" sideOffset={2} size="sm">
                    {t('renameCourse')}
                  </TooltipContent>
                )}
              </Tooltip>
            </>
          ) : (
            <>
              <LucideIcon className="size-4.5 text-muted-foreground/80 dark:text-foreground/80" name={course.icon} />
              {title}
              {course.archived_at && <Badge size="sm">{t('archived')}</Badge>}
            </>
          )}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
