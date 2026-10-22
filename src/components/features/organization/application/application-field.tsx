'use client'

import { useTranslations } from 'next-intl'

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { type ApplicationForm } from './types'

type TextFieldName =
  | 'city'
  | 'contactEmail'
  | 'contactName'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'legalName'
  | 'name'
  | 'registrantEmail'
  | 'registryId'
  | 'url'
  | 'volunteersPerYear'

export const ApplicationField = ({
  autoComplete,
  className,
  form,
  help,
  inputMode,
  label,
  name,
  optional,
  placeholder,
  type,
}: {
  form: ApplicationForm
  label: string
  name: TextFieldName
  autoComplete?: string
  className?: string
  help?: string
  inputMode?: 'email' | 'numeric' | 'text' | 'url'
  optional?: boolean
  placeholder?: string
  type?: 'email' | 'text' | 'url'
}) => {
  const t = useTranslations('Register')

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(className)}>
          <FormLabel>
            {label}
            {optional && <span className="font-normal text-muted-foreground"> {t('optional')}</span>}
          </FormLabel>
          <FormControl>
            <Input
              autoComplete={autoComplete}
              inputMode={inputMode}
              placeholder={placeholder}
              type={type}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          {help && <FormDescription>{help}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
