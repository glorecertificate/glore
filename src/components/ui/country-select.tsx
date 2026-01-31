'use client'

import { useCallback, useMemo, useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useMessages, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { type MessageKey } from '@/lib/i18n'
import { cn, keysOf } from '@/lib/utils'

const countryCodeToFlag = (code: string) =>
  code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('')

export const CountrySelect = ({
  onChange,
  value,
}: React.ComponentProps<typeof Button> & {
  onChange: (value: string) => void
  value?: string
}) => {
  const t = useTranslations('Components.CountrySelect')
  const tCountries = useTranslations('Intl.Countries')
  const messages = useMessages()

  const [open, setOpen] = useState(false)

  const countries = useMemo(
    () =>
      keysOf(messages.Intl.Countries).sort((a, b) =>
        messages.Intl.Countries[a].localeCompare(messages.Intl.Countries[b])
      ),
    [messages]
  )

  const translateCountry = useCallback(
    (code: string) => {
      const key = code as MessageKey<'Intl.Countries'>
      return tCountries.has(key) ? tCountries(key) : key.toUpperCase()
    },
    [tCountries]
  )

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
          role="combobox"
          variant="outline"
        >
          {value ? (
            <span>
              {countryCodeToFlag(value)} {translateCountry(value)}
            </span>
          ) : (
            t('countryPlaceholder')
          )}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={t('searchCountry')} />
          <CommandList>
            <CommandEmpty>{t('noCountryFound')}</CommandEmpty>
            <CommandGroup>
              {countries.map(code => (
                <CommandItem
                  key={code}
                  onSelect={() => {
                    onChange(code)
                    setOpen(false)
                  }}
                  value={translateCountry(code)}
                >
                  <CheckIcon className={cn('mr-2 size-4', value === code ? 'opacity-100' : 'opacity-0')} />
                  <span>{countryCodeToFlag(code)}</span>
                  {translateCountry(code)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
