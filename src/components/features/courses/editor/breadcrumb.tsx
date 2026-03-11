'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { InfoIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useCourse } from '@/components/features/courses/editor/context'
import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbItem, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { IconPicker } from '@/components/ui/icon-picker'
import { InlineInput } from '@/components/ui/inline-input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSession } from '@/hooks/use-session'
import { type IntlRecord, localizeRecord } from '@/lib/i18n'
import { type IconName } from '@/lib/types'
import { cn, debounce } from '@/lib/utils'

const MAX_TITLE_LENGTH = 100
const DEBOUNCE_DELAY = 400

export const CourseBreadcrumb = () => {
  const t = useTranslations('Courses')
  const { user } = useSession()
  const { course, languageStatus, language, editCourse, setCourse } = useCourse()

  const title = localizeRecord(course.title, language)
  const description = course.description ? localizeRecord(course.description, language) : ''
  const [draftTitle, setDraftTitle] = useState(title)
  const [draftDescription, setDraftDescription] = useState(description)
  const [titleFocused, setTitleFocused] = useState(false)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const canEdit = user.canEdit && !course.archivedAt

  useEffect(() => {
    if (!titleFocused) {
      setDraftTitle(title)
    }
  }, [title, titleFocused])

  useEffect(() => {
    if (document.activeElement !== descriptionRef.current) {
      setDraftDescription(description)
    }
  }, [description])

  const commitTitle = useMemo(
    () =>
      debounce((value: string) => {
        setCourse(prev => ({
          ...prev,
          title: { ...prev.title, [language]: value } as IntlRecord,
        }))
      }, DEBOUNCE_DELAY),
    [language, setCourse]
  )

  const commitDescription = useMemo(
    () =>
      debounce((value: string) => {
        setCourse(prev => ({
          ...prev,
          description: { ...prev.description, [language]: value } as IntlRecord,
        }))
      }, DEBOUNCE_DELAY),
    [language, setCourse]
  )

  useEffect(
    () => () => {
      commitTitle.cancel()
      commitDescription.cancel()
    },
    [commitTitle, commitDescription]
  )

  const onTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value.slice(0, MAX_TITLE_LENGTH)
      if (e.target.value.length > MAX_TITLE_LENGTH) {
        toast.warning(t('titleTooLong'))
      }
      setDraftTitle(value)
      commitTitle(value)
    },
    [commitTitle, t]
  )

  const onTitleFocus = useCallback(() => setTitleFocused(true), [])

  const onTitleBlur = useCallback(() => {
    commitTitle.cancel()
    setTitleFocused(false)
    const trimmed = draftTitle.trim()
    if (trimmed === '' || trimmed === title) {
      if (trimmed === '') setDraftTitle(title)
      return
    }
    setCourse(prev => ({
      ...prev,
      title: { ...prev.title, [language]: draftTitle } as IntlRecord,
    }))
  }, [commitTitle, draftTitle, language, setCourse, title])

  const onDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDraftDescription(e.target.value)
      commitDescription(e.target.value)
    },
    [commitDescription]
  )

  const onDescriptionBlur = useCallback(() => {
    commitDescription.cancel()
    if (draftDescription.trim() === description) return
    setCourse(prev => ({
      ...prev,
      description: { ...prev.description, [language]: draftDescription } as IntlRecord,
    }))
  }, [commitDescription, draftDescription, description, language, setCourse])

  return (
    <>
      <BreadcrumbSeparator />

      <BreadcrumbItem className="grow gap-2 pr-6">
        {canEdit ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <IconPicker
                  categorized={false}
                  className="h-4 w-4 shrink-0 text-muted-foreground/80 hover:text-foreground! dark:text-foreground/80 dark:hover:text-foreground! [&>svg]:size-4.5!"
                  defaultValue={(course.icon ?? undefined) as IconName | undefined}
                  fallback={<Skeleton className="h-4 w-4 rounded-md bg-foreground/15" />}
                  onValueChange={icon => editCourse({ icon })}
                  size="text"
                  variant="transparent"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6.5} size="sm">
                {t('updateIcon')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <InlineInput
                  autoWidth
                  className={cn(
                    'mb-0.5 px-1 py-0.5 text-[14.5px] text-foreground/90 hover:text-foreground focus:text-foreground',
                    !titleFocused &&
                      languageStatus.hasTitleUpdates &&
                      'decoration-warning decoration-dotted decoration-2 underline-offset-4'
                  )}
                  defaultValue={title}
                  onBlur={onTitleBlur}
                  onChange={onTitleChange}
                  onFocus={onTitleFocus}
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
            {course.icon && (
              <LucideIcon
                className="size-4.5 text-muted-foreground/80 dark:text-foreground/80"
                name={course.icon as IconName}
              />
            )}
            {title}
            {course.archivedAt && <Badge size="sm">{t('archived')}</Badge>}
          </>
        )}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <InfoIcon
                  className={cn(
                    '-ml-1 size-3.5 cursor-pointer',
                    languageStatus.hasDescriptionUpdates
                      ? 'text-warning hover:text-warning-accent data-[state=open]:text-warning-accent'
                      : 'text-muted-foreground/80 hover:text-foreground data-[state=open]:text-foreground'
                  )}
                />
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6.5} size="sm">
              {t('updateDescription')}
            </TooltipContent>
          </Tooltip>
          <PopoverContent align="start" className="w-80 p-0" side="bottom" sideOffset={8}>
            <div className="px-4 pt-2.5">
              <p className="text-sm font-medium">{t('courseDescription')}</p>
              {canEdit && (
                <p className="text-[13px] font-medium text-muted-foreground">{t('courseDescriptionSubtitle')}</p>
              )}
            </div>
            <div className="p-3">
              {canEdit ? (
                <Textarea
                  autoFocus
                  className="min-h-20 resize-none border-none bg-muted/40 text-sm shadow-none focus-visible:ring-1"
                  onBlur={onDescriptionBlur}
                  onChange={onDescriptionChange}
                  placeholder={t('courseDescriptionPlaceholder')}
                  ref={descriptionRef}
                  rows={3}
                  value={draftDescription}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{description || t('noDescriptionAvailable')}</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </BreadcrumbItem>
    </>
  )
}
