'use client'

import { useEffect, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { IconPicker } from '@/components/ui/icon-picker'
import { InlineInput } from '@/components/ui/inline-input'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { COURSE_TITLE_MAX_LENGTH } from '@/lib/constants'
import { DEFAULT_LOCALE, type IntlRecord, localizeRecord } from '@/lib/i18n'
import { type IconName } from '@/lib/types'
import { debounce } from '@/lib/utils'

const MAX_TITLE_LENGTH = COURSE_TITLE_MAX_LENGTH
const TITLE_COUNTER_FROM = 80
const DEBOUNCE_DELAY = 400

interface CourseHeadingParts {
  counter: React.ReactNode
  description: React.ReactNode
  icon: React.ReactNode
  title: React.ReactNode
}

export const CourseHeading = ({ children }: { children: (parts: CourseHeadingParts) => React.ReactNode }) => {
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

  const languageRef = useRef(language)
  languageRef.current = language

  const [commitTitle] = useState(() =>
    debounce((value: string) => {
      setCourse(prev => ({
        ...prev,
        title: { ...prev.title, [languageRef.current]: value } as IntlRecord,
      }))
    }, DEBOUNCE_DELAY)
  )

  const [commitDescription] = useState(() =>
    debounce((value: string) => {
      setCourse(prev => ({
        ...prev,
        description: { ...prev.description, [languageRef.current]: value } as IntlRecord,
      }))
    }, DEBOUNCE_DELAY)
  )

  useEffect(
    () => () => {
      commitTitle.cancel()
      commitDescription.cancel()
    },
    [commitDescription, commitTitle]
  )

  const onTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingTitle(e.target.value)
    commitTitle(e.target.value)
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

  const icon =
    course.icon &&
    (canEdit ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <IconPicker
            aria-label={tCommon('updateIcon')}
            className="size-8 shrink-0 rounded-full bg-band-scrim text-band-foreground [&>svg]:size-4!"
            defaultValue={(course.icon ?? undefined) as IconName | undefined}
            onValueChange={async name => {
              const result = await editCourse({ icon: name })
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
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-band-scrim text-band-foreground">
        <LucideIcon className="size-4" name={course.icon as IconName} />
      </span>
    ))

  const titleNode = (
    <span className="flex min-w-0 items-start gap-3">
      {canEdit ? (
        <InlineInput
          aria-label={t('renameCourse')}
          className="-mx-1.5 -my-0.5 px-1.5 py-0.5 type-band! hover:bg-band-scrim focus-visible:bg-band-scrim"
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
      {course.archivedAt && <StatusBadge tone="neutral">{tList('archived')}</StatusBadge>}
    </span>
  )

  const counter = canEdit && draftTitle.length >= TITLE_COUNTER_FROM && (
    <output aria-live="polite" className="type-caption text-band-muted">
      {t('titleLength', { count: draftTitle.length, max: MAX_TITLE_LENGTH })}
    </output>
  )

  const descriptionNode = canEdit ? (
    <InlineInput
      aria-label={t('updateDescription')}
      className="-mx-1.5 -my-0.5 max-w-prose px-1.5 py-0.5 text-base text-band-text placeholder:text-band-muted hover:bg-band-scrim focus-visible:bg-band-scrim"
      keepFilled={false}
      onBlur={onDescriptionBlur}
      onChange={onDescriptionChange}
      placeholder={t('courseDescriptionPlaceholder', { lang: languageLabel })}
      ref={descriptionRef}
      value={draftDescription}
    />
  ) : (
    description || t('noDescriptionAvailable')
  )

  return children({ counter, description: descriptionNode, icon, title: titleNode })
}
