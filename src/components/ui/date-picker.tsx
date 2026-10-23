'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

import { CalendarIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { FormControl } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const loadCalendar = async () => (await import('@/components/ui/calendar')).Calendar

const Calendar = dynamic(loadCalendar, {
  loading: () => <Skeleton className="h-75 w-64" />,
  ssr: false,
})

const preloadCalendar = () => {
  void loadCalendar()
}

export const DatePicker = ({
  disabled,
  onBlur,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean
  onBlur?: () => void
  onChange?: (value: string) => void
  placeholder?: string
  value?: string
}) => {
  const t = useTranslations('Components.DatePicker')
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  const selectedDate = (() => {
    if (!value) {
      return undefined
    }
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  })()

  const formatted = (() => {
    if (!selectedDate) {
      return null
    }
    return selectedDate.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  })()

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) onBlur?.()
  }

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      onChange?.(iso)
    } else {
      onChange?.('')
    }
    handleOpenChange(false)
  }

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <FormControl>
        <PopoverTrigger asChild>
          <Button
            className={cn('w-full justify-start font-normal', !selectedDate && 'text-muted-foreground')}
            disabled={disabled}
            onFocus={preloadCalendar}
            onPointerEnter={preloadCalendar}
            type="button"
            variant="outline"
          >
            <CalendarIcon className="mr-2 size-4" />
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
