'use client'

import { useEffect, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { FieldTranslateButton } from '@/components/features/courses/course-editor/field-translate-button'
import { TitleField } from '@/components/features/courses/course-editor/title-field'
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
import { cn, debounce } from '@/lib/utils'

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
  const [titleLength, setTitleLength] = useState<number | null>(null)
  const [draftDescription, setDraftDescription] = useState(description)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const descriptionWrapperRef = useRef<HTMLSpanElement>(null)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [descriptionOverflowing, setDescriptionOverflowing] = useState(false)
  const canEdit = user.canEdit && !course.archivedAt

  useEffect(() => {
    if (document.activeElement !== descriptionRef.current) {
      setDraftDescription(description)
    }
  }, [description])

  useEffect(() => {
    const element = descriptionWrapperRef.current
    if (!element || descriptionExpanded) return
    const measure = () => setDescriptionOverflowing(element.scrollHeight > element.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [description, descriptionExpanded, draftDescription])

  const languageRef = useRef(language)
  languageRef.current = language

  const commitTitle = (value: string) => {
    setCourse(prev => ({
      ...prev,
      title: { ...prev.title, [languageRef.current]: value } as IntlRecord,
    }))
  }

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
      commitDescription.cancel()
    },
    [commitDescription]
  )

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
    <span className="inline-flex max-w-full min-w-0 items-start gap-3">
      {canEdit ? (
        <TitleField
          aria-label={t('renameCourse')}
          className="-mx-1.5 -my-0.5 px-1.5 py-0.5 type-band! hover:bg-band-scrim focus-visible:bg-band-scrim"
          maxLength={MAX_TITLE_LENGTH}
          onCommit={commitTitle}
          onLengthChange={length => setTitleLength(length === null || length >= TITLE_COUNTER_FROM ? length : 0)}
          placeholder={fallbackTitle}
          value={title}
        />
      ) : (
        title
      )}
      {canEdit && (
        <FieldTranslateButton
          className="shrink-0 text-band-foreground hover:bg-band-scrim"
          fieldKey={`courses:${course.id}:title`}
        />
      )}
      {course.archivedAt && <StatusBadge tone="neutral">{tList('archived')}</StatusBadge>}
    </span>
  )

  const counterLength = titleLength ?? title.length
  const counter = canEdit && counterLength >= TITLE_COUNTER_FROM && (
    <output aria-live="polite" className="type-caption text-band-muted">
      {t('titleLength', { count: counterLength, max: MAX_TITLE_LENGTH })}
    </output>
  )

  const descriptionField = canEdit ? (
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

  const descriptionNode = (
    <>
      <span
        className={cn(
          'block',
          !descriptionExpanded && 'max-md:max-h-13 max-md:overflow-hidden',
          !(descriptionExpanded || canEdit) && 'max-md:line-clamp-2',
          canEdit && 'flex items-start gap-1'
        )}
        onFocusCapture={() => setDescriptionExpanded(true)}
        ref={descriptionWrapperRef}
      >
        {descriptionField}
        {canEdit && (
          <FieldTranslateButton
            className="shrink-0 text-band-foreground hover:bg-band-scrim"
            fieldKey={`courses:${course.id}:description`}
          />
        )}
      </span>
      {(descriptionOverflowing || descriptionExpanded) && (
        <button
          aria-expanded={descriptionExpanded}
          className="mt-1 type-caption text-band-text underline underline-offset-2 md:hidden"
          onClick={() => setDescriptionExpanded(value => !value)}
          type="button"
        >
          {descriptionExpanded ? t('descriptionShowLess') : t('descriptionShowMore')}
        </button>
      )}
    </>
  )

  return children({ counter, description: descriptionNode, icon, title: titleNode })
}
