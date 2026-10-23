'use client'

import { type Control } from 'react-hook-form'

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type AppSettingsInput, type SocialPlatform } from '@/lib/app-settings'
import { cn } from '@/lib/utils'

type SettingsFieldName =
  | 'email'
  | 'legalEntity.address'
  | 'legalEntity.name'
  | 'phone'
  | 'website'
  | `social.${SocialPlatform}`

interface SettingsFieldProps {
  className?: string
  control: Control<AppSettingsInput>
  description?: string
  label: string
  name: SettingsFieldName
  placeholder?: string
  type?: React.ComponentProps<typeof Input>['type']
}

export const SettingsField = ({
  className,
  control,
  description,
  label,
  name,
  placeholder,
  type,
}: SettingsFieldProps) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className={cn(className)}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input placeholder={placeholder} type={type} {...field} />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
)
