'use client'

import React, { useState } from 'react'

import { CheckIcon, PlusIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { countryCodeToFlag } from '@/components/ui/country-select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { type MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LANGUAGE_COUNTRIES: Record<string, string> = {
  ar: 'SA',
  bn: 'BD',
  ca: 'AD',
  cs: 'CZ',
  da: 'DK',
  de: 'DE',
  el: 'GR',
  en: 'GB',
  es: 'ES',
  fa: 'IR',
  fi: 'FI',
  fr: 'FR',
  he: 'IL',
  hi: 'IN',
  hu: 'HU',
  id: 'ID',
  it: 'IT',
  ja: 'JP',
  ko: 'KR',
  ms: 'MY',
  nl: 'NL',
  no: 'NO',
  pl: 'PL',
  pt: 'PT',
  ro: 'RO',
  ru: 'RU',
  sv: 'SE',
  sw: 'TZ',
  th: 'TH',
  tr: 'TR',
  uk: 'UA',
  vi: 'VN',
  zh: 'CN',
}

const flag = (language: string) => {
  const code = LANGUAGE_COUNTRIES[language]
  return code ? countryCodeToFlag(code) : ''
}

export const SpokenLanguagesSelect = ({
  className,
  disabled,
  onChange,
  options,
  value,
  ...props
}: Omit<React.ComponentProps<'div'>, 'onChange'> & {
  disabled?: boolean
  onChange: (value: string[]) => void
  options: string[]
  value: string[]
}) => {
  const t = useTranslations('Users')
  const tLanguages = useTranslations('Intl.Languages')

  const [open, setOpen] = useState(false)

  const translate = (language: string) => {
    const key = language as MessageKey<'Intl.Languages'>
    return tLanguages.has(key) ? tLanguages(key) : language.toUpperCase()
  }

  const sortByLabel = (a: string, b: string) => translate(a).localeCompare(translate(b))
  const sortedOptions = options.toSorted(sortByLabel)
  const sortedValue = value.toSorted(sortByLabel)

  const toggle = (language: string) =>
    onChange(value.includes(language) ? value.filter(l => l !== language) : [...value, language])

  return (
    <div className={cn('space-y-3', className)} {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            className={cn('w-full justify-between font-normal', value.length === 0 && 'text-muted-foreground')}
            role="combobox"
            aria-controls="#"
            aria-expanded={open}
            disabled={disabled}
            variant="outline"
          >
            {value.length > 0 ? t('languagesSelected', { count: value.length }) : t('selectLanguages')}
            <PlusIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder={t('searchLanguage')} />
            <CommandList>
              <CommandEmpty>{t('noLanguageFound')}</CommandEmpty>
              <CommandGroup>
                {sortedOptions.map(language => (
                  <CommandItem
                    className="cursor-pointer"
                    key={language}
                    onSelect={() => toggle(language)}
                    value={translate(language)}
                  >
                    <div
                      className={cn(
                        'flex size-4 items-center justify-center rounded-sm border transition-colors',
                        value.includes(language) ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                      )}
                    >
                      <CheckIcon
                        className={cn(
                          'size-3 text-primary-foreground transition-opacity',
                          value.includes(language) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </div>
                    <span className="text-base leading-none">{flag(language)}</span>
                    {translate(language)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {sortedValue.length === 0 ? (
        <p className="text-[13px] leading-snug text-muted-foreground">{t('noLanguagesSelected')}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {sortedValue.map(language => (
            <Badge
              className="group/lang gap-1 py-1 pr-1 pl-2.5 duration-200 animate-in fade-in zoom-in-95"
              key={language}
              variant="muted"
            >
              <span className="text-sm leading-none">{flag(language)}</span>
              {translate(language)}
              <button
                aria-label={t('removeLanguage', { language: translate(language) })}
                className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors not-disabled:cursor-pointer hover:not-disabled:bg-destructive/15 hover:not-disabled:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                disabled={disabled}
                onClick={() => toggle(language)}
                type="button"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
