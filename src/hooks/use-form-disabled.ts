'use client'

import { type Control, type FieldValues, useFormState } from 'react-hook-form'

export const useFormErrored = <T extends FieldValues>(control: Control<T>) => {
  'use no memo'
  const { errors } = useFormState({ control })
  return Object.keys(errors).length > 0
}

export const useFormDisabled = <T extends FieldValues>(control: Control<T>) => {
  'use no memo'
  const { isDirty } = useFormState({ control })
  const errored = useFormErrored(control)
  return !isDirty || errored
}
