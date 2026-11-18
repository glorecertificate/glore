'use client'

import { useEffect, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { courseIconVariants } from '@/components/features/courses/course-list/type-select'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { IconPicker } from '@/components/ui/icon-picker'
import { InlineInput } from '@/components/ui/inline-input'
import { PageHeaderDescription, PageHeaderHeading, PageHeaderTitle } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DEFAULT_LOCALE, type IntlRecord, localizeRecord } from '@/lib/i18n'
import { type IconName } from '@/lib/types'
import { cn, debounce } from '@/lib/utils'

const MAX_TITLE_LENGTH = 100
const DEBOUNCE_DELAY = 400

export const CourseHeading = ({ children }: React.PropsWithChildren) => {
  const t = useTranslations('CourseEditor')
  const tCommon = useTranslations('CourseCommon')
  const tList = useTranslations('CourseList')
  const { user } = useSession()
  const { localeItems } = useI18n()
  const { course, editCourse, language, setCourse } = useCourse()

  const languageLabel = localeItems.find(item => item.value === language)?.displayLabel ?? language

  const title = localizeRecord(course.title, language)
  const fallbackTitle = localizeRecord(course.title, DEFAULT_LOCALE)
  const description = course.description ? localizeRecord(course.description, language) : ''
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [draftDescription, setDraftDescription] = useState(description)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const canEdit = user.canEdit && !course.archivedAt

  const draftTitle = editingTitle ?? title

  useEffect(() => {
    if (document.activeElement !== descriptionRef.current) {
      setDraftDescription(description)
    }
  }, [description])

  const commitTitle = debounce((value: string) => {
    setCourse(prev => ({
      ...prev,
      title: { ...prev.title, [language]: value } as IntlRecord,
    }))
  }, DEBOUNCE_DELAY)

  const commitDescription = debounce((value: string) => {
    setCourse(prev => ({
      ...prev,
      description: { ...prev.description, [language]: value } as IntlRecord,
    }))
  }, DEBOUNCE_DELAY)

  useEffect(
    () => () => {
      commitTitle.cancel()
      commitDescription.cancel()
    },
    [commitTitle, commitDescription]
  )

  const onTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_TITLE_LENGTH)
    if (e.target.value.length > MAX_TITLE_LENGTH) {
      toast.warning(t('titleTooLong'))
    }
    setEditingTitle(value)
    commitTitle(value)
  }

  const onTitleFocus = () => setEditingTitle(title)

  const onTitleBlur = () => {
    commitTitle.cancel()
    const value = editingTitle ?? title
    setEditingTitle(null)
    const trimmed = value.trim()
    if (trimmed === '' || trimmed === title) return
    setCourse(prev => ({
      ...prev,
      title: { ...prev.title, [language]: value } as IntlRecord,
    }))
  }

  const onDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftDescription(e.target.value)
    commitDescription(e.target.value)
  }

  const onDescriptionBlur = () => {
    commitDescription.cancel()
    if (draftDescription.trim() === description) return
    setCourse(prev => ({
      ...prev,
      description: { ...prev.description, [language]: draftDescription } as IntlRecord,
    }))
  }

  const iconClassName = courseIconVariants({ type: course.type })

  return (
    <PageHeaderHeading className="min-w-0 flex-1 gap-2">
      <div className="flex min-w-0 items-start gap-3">
        {course.icon &&
          (canEdit ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <IconPicker
                  aria-label={tCommon('updateIcon')}
                  className={cn('mt-1 size-6 shrink-0 [&>svg]:size-6!', iconClassName)}
                  defaultValue={(course.icon ?? undefined) as IconName | undefined}
                  onValueChange={async icon => {
                    const result = await editCourse({ icon })
                    if ('error' in result) return
                    toast.success(tCommon('iconUpdateSuccess'))
                  }}
                  size="text"
                  variant="transparent"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={10} size="sm">
                {tCommon('updateIcon')}
              </TooltipContent>
            </Tooltip>
          ) : (
            <LucideIcon className={cn('mt-1 size-6 shrink-0', iconClassName)} name={course.icon as IconName} />
          ))}
        <PageHeaderTitle className="min-w-0 flex-1">
          {canEdit ? (
            <InlineInput
              aria-label={t('renameCourse')}
              className="-my-0.5 px-1.5 py-0.5 type-title!"
              maxLength={MAX_TITLE_LENGTH}
              onBlur={onTitleBlur}
              placeholder={fallbackTitle}
              onChange={onTitleChange}
              onFocus={onTitleFocus}
              value={draftTitle}
            />
          ) : (
            title
          )}
        </PageHeaderTitle>
        {course.archivedAt && <StatusBadge tone="neutral">{tList('archived')}</StatusBadge>}
      </div>
      {canEdit ? (
        <InlineInput
          aria-label={t('updateDescription')}
          className="-my-0.5 max-w-prose px-1.5 py-0.5 text-base text-muted-foreground"
          keepFilled={false}
          onBlur={onDescriptionBlur}
          onChange={onDescriptionChange}
          placeholder={t('courseDescriptionPlaceholder', { lang: languageLabel })}
          ref={descriptionRef}
          value={draftDescription}
        />
      ) : (
        <PageHeaderDescription>{description || t('noDescriptionAvailable')}</PageHeaderDescription>
      )}
      {children}
    </PageHeaderHeading>
  )
}
