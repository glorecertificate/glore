'use client'

import { useRef } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { planTranslation, sourcesOf } from '@/components/features/courses/course-editor/translation-fields'
import { useTranslate } from '@/components/features/translations/use-translate'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LOCALES } from '@/lib/i18n'

interface FieldTranslateButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
  fieldKey: string
}

export const FieldTranslateButton = ({ fieldKey, ...props }: FieldTranslateButtonProps) => {
  const t = useTranslations('CourseTranslate')
  const { localeItems } = useI18n()
  const { applyTranslated, course, language } = useCourse()
  const seen = useRef<ReadonlyMap<string, unknown>>(new Map())
  const translate = useTranslate({ onField: field => applyTranslated(field, seen.current) })

  const sources = sourcesOf(course, fieldKey, LOCALES, language)
  if (sources.length === 0) return null

  const running = translate.status === 'running'
  const nameOf = (locale: string) => localeItems.find(item => item.value === locale)?.label ?? locale

  const run = async (source: Locale) => {
    const plan = planTranslation({ course, fieldKeys: [fieldKey], replace: true, source, targets: [language] })
    if (plan.fields.length === 0) return
    seen.current = plan.seen
    const ok = await translate.run({ fields: plan.fields, replace: true, source, targets: [language] })
    toast[ok ? 'success' : 'error'](ok ? t('field.done') : t('field.failed'))
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={props.children ? undefined : t('field.trigger')}
              disabled={running}
              icon="languages"
              loading={running}
              size="icon-sm"
              type="button"
              variant="transparent"
              {...props}
            />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent size="sm">{t('field.trigger')}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {sources.map(locale => (
          <DropdownMenuItem key={locale} onSelect={() => run(locale as Locale)}>
            {t('field.from', { language: nameOf(locale) })}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
