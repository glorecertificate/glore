'use client'

import { useCallback, useMemo, useTransition } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import {
  Select,
  SelectContent,
  type SelectContentProps,
  SelectItem,
  SelectTrigger,
  type SelectTriggerProps,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/hooks/use-i18n'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface LanguageSelectProps extends Omit<SelectTriggerProps, 'onChange'> {
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

type LanguageSelectItem = (typeof i18n.localeItems)[number] & {
  badge?: React.ReactNode
  status?: string | null
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
  const { locale, localeItems, setLocale } = useI18n()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('Common')

  const items = useMemo<LanguageSelectItem[]>(
    () => localeItems.filter(item => values.includes(item.value)),
    [localeItems, values]
  )

  const activeItem = useMemo<LanguageSelectItem>(
    () =>
      localeItems.find(item => (controlled && value ? item.value === value : item.value === locale)) ?? localeItems[0]!,
    [controlled, locale, localeItems, value]
  )

  const activeItemValue = controlled ? value : locale

  const onValueChange = useCallback(
    (newLocale: Locale) => {
      if (!controlled) {
        startTransition(() => setLocale(newLocale))
      }
      onChange?.(newLocale)
    },
    [controlled, onChange, setLocale]
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
                <TooltipContent>{activeItem.status}</TooltipContent>
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
