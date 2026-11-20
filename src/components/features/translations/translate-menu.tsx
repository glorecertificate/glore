'use client'

import { useRef } from 'react'

import { useTranslations } from 'next-intl'

import { type TranslationPlan } from '@/components/features/translations/field-translate-button'
import { type TranslatedField, useTranslate } from '@/components/features/translations/use-translate'
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

interface TranslateMenuProps {
  beforeRun?: () => unknown
  empty: string
  onApply: (event: TranslatedField, seen: ReadonlyMap<string, string>) => void
  plan: (source: string) => TranslationPlan
  sources: string[]
  target: string
}

export const TranslateMenu = ({ beforeRun, empty, onApply, plan, sources, target }: TranslateMenuProps) => {
  const t = useTranslations('CourseTranslate')
  const { localeItems } = useI18n()
  const seen = useRef<ReadonlyMap<string, string>>(new Map())
  const translate = useTranslate({ onField: event => onApply(event, seen.current) })

  const running = translate.status === 'running'
  const nameOf = (locale: string) => localeItems.find(item => item.value === locale)?.label ?? locale

  const run = async (source: string) => {
    await beforeRun?.()
    const next = plan(source)
    if (next.fields.length === 0) return
    seen.current = next.seen
    const ok = await translate.run({ fields: next.fields, replace: true, source, targets: [target] })
    toast[ok ? 'success' : 'error'](ok ? t('field.done') : t('field.failed'))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button icon="languages" loading={running} type="button" variant="outline">
          {t('open')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sources.length === 0 && (
          <DropdownMenuLabel className="max-w-64 font-normal text-muted-foreground">{empty}</DropdownMenuLabel>
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
