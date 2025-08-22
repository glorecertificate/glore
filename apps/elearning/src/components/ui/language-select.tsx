'use client'

import { useCallback, useMemo, useTransition } from 'react'

import { Tooltip } from '@radix-ui/react-tooltip'
import { type Locale } from 'use-intl'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  type SelectContentProps,
  type SelectTriggerProps,
} from '@/components/ui/select'
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLocale } from '@/hooks/use-locale'
import { useTranslations } from '@/hooks/use-translations'
import { i18n } from '@/lib/i18n/config'
import { type LocaleItem } from '@/lib/i18n/types'
import { cn } from '@/lib/utils'
import config from 'config/app.json'

const DEFAULT_VALUES = Object.keys(config.locales) as Locale[]

interface LanguageSelectItem extends LocaleItem {
  badge?: React.ReactNode
  status?: string | null
}

export interface LanguageSelectProps extends Omit<SelectTriggerProps, 'onChange'> {
  addLanguage?: (locale: Locale) => void
  contentProps?: SelectContentProps
  controlled?: boolean
  onChange?: (locale: Locale) => void
  status?: {
    published?: Locale[]
    draft?: Locale[]
  }
  value?: Locale
  values?: Locale[]
}

export const LanguageSelect = ({
  addLanguage,
  className,
  contentProps,
  controlled = false,
  onChange,
  status,
  value,
  values = DEFAULT_VALUES,
  ...props
}: LanguageSelectProps) => {
  const { locale, setLocale } = useLocale()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('Common')

  const items = useMemo<LanguageSelectItem[]>(
    () => i18n.localeItems.filter(item => values.includes(item.value)),
    [values],
  )

  const activeItem = useMemo<LanguageSelectItem>(
    () => items.find(item => (controlled ? item.value === value : item.value === locale))!,
    [controlled, items, locale, value],
  )

  const activeItemValue = useMemo(() => (controlled ? value : locale), [controlled, locale, value])

  const onValueChange = useCallback(
    (locale: Locale) => {
      if (!controlled) startTransition(() => setLocale(locale))
      onChange?.(locale)
    },
    [controlled, onChange, setLocale],
  )

  return (
    <Select onValueChange={onValueChange} value={activeItemValue}>
      <SelectTrigger className={cn('gap-1', isPending && 'pointer-events-none', className)} {...props}>
        <span className="relative">
          <div className="flex items-center gap-1.5" title={t('switchLanguage')}>
            {activeItem.status && (
              <Tooltip>
                <TooltipTrigger asChild pointerEvents="auto">
                  {activeItem.badge}
                </TooltipTrigger>
                <TooltipContent arrow={false}>{activeItem.status}</TooltipContent>
              </Tooltip>
            )}
            <span>
              {activeItem?.label} {activeItem?.icon}
            </span>
          </div>
        </span>
      </SelectTrigger>
      <SelectContent align="end" position="popper" {...contentProps}>
        {items.map(item => (
          <SelectItem
            className={cn(item.value === activeItem?.value && 'pointer-events-none cursor-default bg-accent')}
            key={item.value}
            value={item.value}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="flex items-center gap-1">
                {item.label} {item.icon}
              </span>
              <span className="flex items-center gap-1 [&_svg]:size-2">
                {item.badge}
                <span className="text-xs text-muted-foreground">{item.status}</span>
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
