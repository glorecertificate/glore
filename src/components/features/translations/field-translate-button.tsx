'use client'

import { useRef } from 'react'

import { useTranslations } from 'next-intl'

import { type TranslatedField, useTranslate } from '@/components/features/translations/use-translate'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface TranslationPlan {
  fields: { existing: Record<string, boolean>; key: string; text: unknown }[]
  seen: ReadonlyMap<string, string>
}

export interface FieldTranslateButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
  beforeRun?: () => unknown
  onApply: (event: TranslatedField, seen: ReadonlyMap<string, string>) => void
  onRunningChange?: (running: boolean) => void
  plan: (source: string) => TranslationPlan
  sources: string[]
  target: string
}

export const FieldTranslateButton = ({
  beforeRun,
  className,
  onApply,
  onRunningChange,
  plan,
  sources,
  target,
  ...props
}: FieldTranslateButtonProps) => {
  const t = useTranslations('CourseTranslate')
  const { localeItems } = useI18n()
  const seen = useRef<ReadonlyMap<string, string>>(new Map())
  const translate = useTranslate({ onField: event => onApply(event, seen.current) })

  const running = translate.status === 'running'

  if (sources.length === 0) return null

  const nameOf = (locale: string) => localeItems.find(item => item.value === locale)?.label ?? locale

  const run = async (source: string) => {
    await beforeRun?.()
    const next = plan(source)
    if (next.fields.length === 0) return
    seen.current = next.seen
    onRunningChange?.(true)
    try {
      const ok = await translate.run({ fields: next.fields, replace: true, source, targets: [target] })
      toast[ok ? 'success' : 'error'](ok ? t('field.done') : t('field.failed'))
    } finally {
      onRunningChange?.(false)
    }
  }

  return (
    <span className="invisible -my-1 inline-flex shrink-0 self-center opacity-0 transition-opacity group-focus-within/field:visible group-focus-within/field:opacity-100 focus-within:visible focus-within:opacity-100 has-[:disabled]:visible has-[:disabled]:opacity-100 has-[[aria-expanded=true]]:visible has-[[aria-expanded=true]]:opacity-100">
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t('field.trigger')}
                className={cn('disabled:pointer-events-none disabled:opacity-100', className)}
                disabled={running}
                icon="languages"
                loading={running}
                size="icon-sm"
                stable
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
            <DropdownMenuItem key={locale} onSelect={() => run(locale)}>
              {t('field.from', { language: nameOf(locale) })}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}
