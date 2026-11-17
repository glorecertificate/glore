'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export interface DescriptionChoiceOption {
  id: string
  text: string
}

export const DescriptionChoice = ({
  className,
  disabled,
  id,
  onValueChange,
  options,
  value,
  ...props
}: Omit<React.ComponentProps<typeof RadioGroup>, 'onValueChange' | 'value'> & {
  id: string
  onValueChange: (value: string) => void
  options: DescriptionChoiceOption[]
  value: string | null
}) => (
  <RadioGroup
    className={cn('gap-3', className)}
    disabled={disabled}
    onValueChange={onValueChange}
    required
    value={value ?? ''}
    {...props}
  >
    {options.map(option => (
      <Label
        className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 leading-relaxed font-normal transition-colors has-disabled:cursor-default has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-primary/5 has-[:focus-visible]:focus-ring"
        htmlFor={`${id}-${option.id}`}
        key={option.id}
      >
        <RadioGroupItem className="mt-0.5" id={`${id}-${option.id}`} value={option.id} />
        <span className="min-w-0 flex-1">{option.text}</span>
      </Label>
    ))}
  </RadioGroup>
)
