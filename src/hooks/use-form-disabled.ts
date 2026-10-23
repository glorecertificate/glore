'use client'

import { type Control, type FieldValues, useFormState } from 'react-hook-form'

export const useFormDisabled = <T extends FieldValues>(control: Control<T>) => {
  const { errors, isDirty } = useFormState({ control })
  return !isDirty || Object.keys(errors).length > 0
}
