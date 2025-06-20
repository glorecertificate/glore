'use client'

import { useCallback, useMemo, useTransition } from 'react'

import { Loader } from '@/components/ui/icons/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, type SelectTriggerProps } from '@/components/ui/select'
import { useLocale } from '@/hooks/use-locale'
import { useTranslations } from '@/hooks/use-translations'
import { type Locale } from '@/lib/i18n/types'
import { cn } from '@/lib/utils'
import config from 'static/config.json'

const items = Object.entries(config.locales).map(([value, { flag, name }]) => ({
  label: name,
  value,
  icon: flag,
}))

export const LanguageSelect = (props: SelectTriggerProps) => {
  const { locale, setLocale } = useLocale()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('Common')

  const activeItem = useMemo(() => items.find(item => item.value === locale), [locale])

  const onChange = useCallback(
    (locale: Locale) => {
      startTransition(async () => {
        await setLocale(locale)
      })
    },
    [setLocale],
  )

  return (
    <Select defaultValue={locale} onValueChange={onChange}>
      <SelectTrigger
        className={cn('hover:bg-accent', isPending && 'pointer-events-none')}
        title={t('selectLanguage')}
        {...props}
      >
        <span className="relative">
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="size-4" />
            </div>
          )}
          <span className={cn(isPending && 'cursor-default opacity-30')}>
            {activeItem?.label} {activeItem?.icon}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent align="end" position="popper">
        {items.map(item => (
          <SelectItem
            className={cn(item.value === activeItem?.value && 'pointer-events-none cursor-default bg-accent')}
            key={item.value}
            value={item.value}
          >
            <span>
              {item.label} {item?.icon}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
