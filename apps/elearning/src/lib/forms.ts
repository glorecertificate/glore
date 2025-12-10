import type { FieldValues, UseFormReturn } from 'react-hook-form'

import { EMAIL_REGEX, USERNAME_REGEX } from '@/lib/constants'

export const isValidUsername = (value: string) => EMAIL_REGEX.test(value) || USERNAME_REGEX.test(value)

export const isFormDisabled = <T extends FieldValues>({ formState }: UseFormReturn<T>) =>
  !formState.isDirty || Object.keys(formState.errors).length > 0
