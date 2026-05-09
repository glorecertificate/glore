'use client'

import { useCallback, useMemo, useState } from 'react'

import { CalendarIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { FormControl } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export const DatePicker = ({
  disabled,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean
  onChange?: (value: string) => void
  placeholder?: string
  value?: string
}) => {
  const t = useTranslations('Components.DatePicker')
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  const selectedDate = useMemo(() => {
    if (!value) {
      return undefined
    }
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])

  const formatted = useMemo(() => {
    if (!selectedDate) {
      return null
    }
    return selectedDate.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [selectedDate, locale])

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        onChange?.(iso)
      } else {
        onChange?.('')
      }
      setOpen(false)
    },
    [onChange]
  )

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <FormControl>
        <PopoverTrigger asChild>
          <Button
            className={cn('w-full justify-start font-normal', !selectedDate && 'text-muted-foreground')}
            disabled={disabled}
            type="button"
            variant="outline"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatted ?? placeholder ?? t('selectDate')}
          </Button>
        </PopoverTrigger>
      </FormControl>
      <PopoverContent align="start" className="w-auto overflow-hidden p-0">
        <Calendar
          captionLayout="dropdown"
          defaultMonth={selectedDate}
          disabled={disabled}
          endMonth={new Date()}
          mode="single"
          onSelect={handleSelect}
          selected={selectedDate}
          startMonth={new Date(1920, 0)}
        />
      </PopoverContent>
    </Popover>
  )
}
