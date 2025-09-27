'use client'

import { useCallback, useMemo, useTransition } from 'react'

import { i18n, useLocale, useTranslations, type Locale, type LocaleItem } from '@repo/i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  type SelectContentProps,
  type SelectTriggerProps,
} from '@repo/ui/components/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/tooltip'
import { cn } from '@repo/ui/utils'

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
  values = i18n.locales,
  ...props
}: LanguageSelectProps) => {
  const { locale, localeItems, setLocale } = useLocale()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('Common')

  const items = useMemo<LanguageSelectItem[]>(
    () => localeItems.filter(item => values.includes(item.value)),
    [localeItems, values],
  )

  const activeItem = useMemo<LanguageSelectItem>(
    () => localeItems.find(item => (controlled ? item.value === value : item.value === locale))!,
    [controlled, locale, localeItems, value],
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
