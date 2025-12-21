import { cx } from 'class-variance-authority'
import type { ClassValue } from 'class-variance-authority/types'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { extendTailwindMerge } from 'tailwind-merge'

import { EMAIL_REGEX, USERNAME_REGEX } from '@/lib/constants'

export const twMerge = extendTailwindMerge<'text-stroke-width' | 'text-stroke-color'>({
  extend: {
    classGroups: {
      'text-stroke-width': [{ 'text-stroke': [(n: string) => Number(n) > 0] }],
      'text-stroke-color': [{ 'text-stroke': [(n: string) => !Number(n)] }],
    },
  },
})

export const cn = (...inputs: ClassValue[]) => twMerge(cx(inputs))

export const tw = (raw: TemplateStringsArray, ...values: string[]) => cn(String.raw({ raw }, ...values))

export const isValidUsername = (value: string) => EMAIL_REGEX.test(value) || USERNAME_REGEX.test(value)

export const defaultFormDisabled = <T extends FieldValues>({ formState }: UseFormReturn<T>) =>
  !formState.isDirty || Object.keys(formState.errors).length > 0
