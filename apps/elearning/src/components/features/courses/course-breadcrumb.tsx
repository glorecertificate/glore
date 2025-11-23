'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { type IconName } from 'lucide-react/dynamic'
import { useTranslations } from 'next-intl'

import { debounce } from '@glore/utils/debounce'

import { DynamicIcon } from '@/components/icons/dynamic'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { InlineInput } from '@/components/ui/inline-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCourse } from '@/hooks/use-course'
import { useIntl } from '@/hooks/use-intl'
import { usePortal } from '@/hooks/use-portal'
import { useSession } from '@/hooks/use-session'

export const CourseBreadcrumb = () => {
  const Breadcrumb = usePortal('breadcrumb')
  const { user } = useSession()
  const { course, language, setCourse, setSettingsOpen } = useCourse()
  const { localize } = useIntl()
  const t = useTranslations('Courses')

  const title = localize(course.title, language)
  const [draftTitle, setDraftTitle] = useState(title)

  useEffect(() => {
    setDraftTitle(title)
  }, [title])

  const commitTitle = useMemo(
    () =>
      debounce((value: string) => {
        setCourse(currentCourse => ({
          ...currentCourse,
          title: {
            ...currentCourse.title,
            [language]: value,
          },
        }))
      }, 250),
    [language, setCourse]
  )

  const onTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setDraftTitle(value)
      commitTitle(value)
    },
    [commitTitle]
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
            <Tooltip>
              <TooltipTrigger asChild>
                <InlineInput className="h-8 w-min px-1" onChange={onTitleChange} value={draftTitle} />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                {t('renameCourse')}
              </TooltipContent>
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
