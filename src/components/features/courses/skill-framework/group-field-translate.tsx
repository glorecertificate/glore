'use client'

import { useRef } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { useTranslate } from '@/components/features/translations/use-translate'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import { type IntlRecord, LOCALES } from '@/lib/i18n'
import { hasText } from '@/lib/translate'

export type GroupField = 'description' | 'name'

interface GroupFieldTranslateProps {
  field: GroupField
  language: Locale
  onApply: (field: GroupField, locale: Locale, value: string, seen: string) => void
  onRunningChange: (running: boolean) => void
  values: IntlRecord
}

const fieldKey = (field: GroupField) => `skill_groups:draft:${field}`

export const GroupFieldTranslate = ({
  field,
  language,
  onApply,
  onRunningChange,
  values,
}: GroupFieldTranslateProps) => {
  const t = useTranslations('CourseTranslate')
  const tGroup = useTranslations('Learning.framework')
  const { localeItems } = useI18n()
  const seen = useRef('')
  const translate = useTranslate({
    onField: event => {
      if (event.key !== fieldKey(field) || typeof event.value !== 'string') return
      onApply(field, event.locale as Locale, event.value, seen.current)
    },
  })

  const running = translate.status === 'running'
  const sources = LOCALES.filter(locale => locale !== language && hasText(values[locale]))
  const nameOf = (locale: string) => localeItems.find(item => item.value === locale)?.label ?? locale

  const run = async (source: Locale) => {
    seen.current = values[language] ?? ''
    onRunningChange(true)
    try {
      const ok = await translate.run({
        fields: [{ existing: { [language]: hasText(values[language]) }, key: fieldKey(field), text: values[source] }],
        replace: true,
        source,
        targets: [language],
      })
      toast[ok ? 'success' : 'error'](ok ? t('field.done') : t('field.failed'))
    } finally {
      onRunningChange(false)
    }
  }

  return (
    <span className="-my-1 inline-flex shrink-0 self-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="disabled:pointer-events-none disabled:opacity-100"
            disabled={running}
            icon="languages"
            loading={running}
            size="xs"
            spinner="size-3.5"
            type="button"
            variant="ghost"
          >
            {t('open')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {sources.length === 0 && <DropdownMenuItem disabled>{tGroup('translateEmpty')}</DropdownMenuItem>}
          {sources.map(locale => (
            <DropdownMenuItem key={locale} onSelect={() => run(locale as Locale)}>
              {t('field.from', { language: nameOf(locale) })}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}
