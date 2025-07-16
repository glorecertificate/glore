'use client'

import { useCallback, useMemo, useTransition } from 'react'

import { type Locale } from 'use-intl'

import { Loader } from '@/components/ui/icons/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, type SelectTriggerProps } from '@/components/ui/select'
import { useLocale } from '@/hooks/use-locale'
import { useTranslations } from '@/hooks/use-translations'
import { LOCALE_ITEMS } from '@/lib/i18n/utils'
import { cn } from '@/lib/utils'
import config from 'config/app.json'

export const LanguageSelect = ({
  controlled = false,
  onChange,
  value,
  values = Object.keys(config.locales) as Locale[],
  ...props
}: SelectTriggerProps & {
  controlled?: boolean
  onChange?: (locale: Locale) => void
  value?: Locale
  values?: Locale[]
}) => {
  const { locale, setLocale } = useLocale()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('Common')

  const items = useMemo(() => LOCALE_ITEMS.filter(item => values.includes(item.value)), [values])

  const activeItem = useMemo(
    () =>
      items.find(item => {
        if (controlled) return item.value === value
        return item.value === locale
      }),
    [items, controlled, locale, value],
  )

  const onValueChange = useCallback(
    (locale: Locale) => {
      if (!controlled)
        startTransition(async () => {
          await setLocale(locale)
        })
      if (onChange) onChange(locale)
    },
    [controlled, onChange, setLocale],
  )

  return (
    <Select defaultValue={locale} onValueChange={onValueChange}>
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
