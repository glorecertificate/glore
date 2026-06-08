'use client'

import { useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useMessages, useTranslations } from 'next-intl'

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { countryCodeToFlag } from '@/components/ui/country-select'
import { type InputProps } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { type MessageKey } from '@/lib/i18n'
import { COUNTRY_CALLING_CODES, formatPhoneNumber, splitPhoneNumber } from '@/lib/phone'
import { cn, keysOf } from '@/lib/utils'

interface PhoneInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  defaultCountry?: string
  onChange: (value: string) => void
  value?: string
}

export const PhoneInput = ({ defaultCountry = 'it', disabled, onChange, value, ...props }: PhoneInputProps) => {
  const t = useTranslations('Components.PhoneInput')
  const tCountries = useTranslations('Intl.Countries')
  const messages = useMessages()

  const [open, setOpen] = useState(false)
  const [country, setCountry] = useState(() => splitPhoneNumber(value).country ?? defaultCountry)

  const code = country ? COUNTRY_CALLING_CODES[country] : undefined
  const national = code && value?.startsWith(code) ? value.slice(code.length).trim() : (value ?? '')

  const translateCountry = (current: string) => {
    const key = current as MessageKey<'Intl.Countries'>
    return tCountries.has(key) ? tCountries(key) : key.toUpperCase()
  }

  const countries = keysOf(messages.Intl.Countries)
    .filter(current => current in COUNTRY_CALLING_CODES)
    .sort((a, b) => translateCountry(a).localeCompare(translateCountry(b)))

  const selectCountry = (next: string) => {
    setCountry(next)
    setOpen(false)
    onChange(formatPhoneNumber(next, national))
  }

  return (
    <InputGroup className={cn(disabled && 'pointer-events-none opacity-50')}>
      <InputGroupAddon align="inline-start" className="pr-0">
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger asChild>
            <InputGroupButton
              aria-controls="#"
              aria-expanded={open}
              aria-label={t('selectPrefix')}
              className="gap-1 font-normal"
              disabled={disabled}
              role="combobox"
            >
              <span>{country ? countryCodeToFlag(country) : '🌐'}</span>
              <span>{code ?? ''}</span>
              <ChevronsUpDownIcon className="size-3 shrink-0 opacity-50" />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <Command>
              <CommandInput placeholder={t('search')} />
              <CommandList>
                <CommandEmpty>{t('noResults')}</CommandEmpty>
                <CommandGroup>
                  {countries.map(current => (
                    <CommandItem
                      key={current}
                      onSelect={() => selectCountry(current)}
                      value={`${translateCountry(current)} ${COUNTRY_CALLING_CODES[current]} ${current}`}
                    >
                      <span className="pr-0.5">{countryCodeToFlag(current)}</span>
                      <span className="flex-1 truncate">{translateCountry(current)}</span>
                      <span className="text-muted-foreground">{COUNTRY_CALLING_CODES[current]}</span>
                      <CheckIcon className={cn('size-4', country === current ? 'opacity-100' : 'opacity-0')} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
      <InputGroupInput
        disabled={disabled}
        inputMode="tel"
        onChange={event => onChange(formatPhoneNumber(country, event.target.value))}
        type="tel"
        value={national}
        {...props}
      />
    </InputGroup>
  )
}
