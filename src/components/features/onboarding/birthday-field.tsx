'use client'

import { useState } from 'react'

import { CalendarIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { type OnboardingFormValues } from '@/components/features/onboarding/schema'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const toISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const BirthdayField = ({ disabled }: { disabled: boolean }) => {
  const t = useTranslations('Onboarding')
  const format = useFormatter()
  const form = useFormContext<OnboardingFormValues>()
  const [open, setOpen] = useState(false)

  return (
    <FormField
      control={form.control}
      name="birthday"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('birthdayLabel')}</FormLabel>
          <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                  disabled={disabled}
                  variant="outline"
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {field.value
                    ? format.dateTime(new Date(field.value), {
                        day: '2-digit',
                        month: '2-digit',
                        timeZone: 'UTC',
                        year: 'numeric',
                      })
                    : t('birthdayPlaceholder')}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                captionLayout="dropdown"
                defaultMonth={field.value ? new Date(field.value) : undefined}
                disabled={date => date > new Date()}
                endMonth={new Date()}
                mode="single"
                onSelect={date => {
                  field.onChange(date ? toISODate(date) : '')
                  setOpen(false)
                }}
                selected={field.value ? new Date(field.value) : undefined}
                startMonth={new Date(1900, 0)}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
