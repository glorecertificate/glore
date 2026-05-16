'use client'

import { createContext, use, useId } from 'react'

import { Slot, type SlotProps } from '@radix-ui/react-slot'
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  useFormState,
} from 'react-hook-form'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const Form = FormProvider

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
}

const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue)

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  ...props
}: ControllerProps<TFieldValues, TName>) => (
  <FormFieldContext.Provider value={{ name }}>
    <Controller {...props} name={name} />
  </FormFieldContext.Provider>
)

export const useFormField = () => {
  const fieldContext = use(FormFieldContext)
  const itemContext = use(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error('useFormField must be used within a FormField')
  }

  const { id } = itemContext

  return {
    formDescriptionId: `${id}-form-item-description`,
    formItemId: `${id}-form-item`,
    formMessageId: `${id}-form-item-message`,
    id,
    name: fieldContext.name,
    ...fieldState,
  }
}

interface FormItemContextValue {
  id: string
}

const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue)

export const FormItem = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const id = useId()
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('grid gap-2', className)} data-slot="form-item" {...props} />
    </FormItemContext.Provider>
  )
}

export const FormLabel = ({ className, ...props }: React.ComponentProps<typeof Label>) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      className={cn('data-[error=true]:text-destructive', className)}
      data-error={Boolean(error)}
      data-slot="form-label"
      htmlFor={formItemId}
      {...props}
    />
  )
}

export const FormControl = ({ ...props }: SlotProps) => {
  const { error, formDescriptionId, formItemId, formMessageId } = useFormField()

  return (
    <Slot
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={Boolean(error)}
      data-slot="form-control"
      id={formItemId}
      {...props}
    />
  )
}

export const FormDescription = ({ className, ...props }: React.ComponentProps<'p'>) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      data-slot="form-description"
      id={formDescriptionId}
      {...props}
    />
  )
}

export const FormMessage = ({ className, ...props }: React.ComponentProps<'p'>) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : props.children

  if (!body) {
    return null
  }

  return (
    <p
      className={cn('text-sm leading-[normal] text-destructive', className)}
      data-slot="form-message"
      id={formMessageId}
      {...props}
    >
      {body}
    </p>
  )
}
