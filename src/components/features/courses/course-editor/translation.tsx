'use client'

import { useRef } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import {
  listEditorFields,
  planTranslation,
  sourcesOf,
} from '@/components/features/courses/course-editor/translation-fields'
import { useTranslate } from '@/components/features/translations/use-translate'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LOCALES } from '@/lib/i18n'
import { isTempId } from '@/lib/utils'

export const CourseTranslation = () => {
  const t = useTranslations('CourseTranslate')
  const { localeItems } = useI18n()
  const { applyTranslated, course, currentLesson, language } = useCourse()
  const seen = useRef<ReadonlyMap<string, unknown>>(new Map())
  const translate = useTranslate({ onField: field => applyTranslated(field, seen.current) })

  const lessonId = currentLesson?.id
  const saved = lessonId !== undefined && !isTempId(lessonId)
  const running = translate.status === 'running'
  const nameOf = (locale: string) => localeItems.find(item => item.value === locale)?.label ?? locale
  const sources = saved
    ? LOCALES.filter(
        locale =>
          sourcesOf(course, `lessons:${lessonId}:title`, [locale], language).length > 0 ||
          sourcesOf(course, `lessons:${lessonId}:content`, [locale], language).length > 0
      )
    : []

  const run = async (source: Locale) => {
    const fieldKeys = listEditorFields(course).flatMap(field => (field.lessonId === lessonId ? [field.key] : []))
    const plan = planTranslation({ course, fieldKeys, replace: true, source, targets: [language] })
    if (plan.fields.length === 0) return
    seen.current = plan.seen
    const ok = await translate.run({ fields: plan.fields, replace: true, source, targets: [language] })
    toast[ok ? 'success' : 'error'](ok ? t('field.done') : t('field.failed'))
  }

  const trigger = (
    <Button disabled={!saved} icon="languages" loading={running} variant="outline">
      {t('open')}
    </Button>
  )

  if (!saved) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{trigger}</span>
        </TooltipTrigger>
        <TooltipContent>{t('menu.unsaved')}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sources.length === 0 && (
          <DropdownMenuLabel className="max-w-64 font-normal text-muted-foreground">
            {t('menu.empty')}
          </DropdownMenuLabel>
        )}
        {sources.map(locale => (
          <DropdownMenuItem key={locale} onSelect={() => run(locale)}>
            {t('field.from', { language: nameOf(locale) })}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
