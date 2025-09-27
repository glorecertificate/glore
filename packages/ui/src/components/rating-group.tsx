import { cva, type VariantProps } from 'class-variance-authority'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { Label } from '@repo/ui/components/label'
import { RadioGroup, RadioGroupItem, type RadioGroupProps } from '@repo/ui/components/radio-group'
import { cn } from '@repo/ui/utils'

export interface RatingGroupProps
  extends Omit<RadioGroupProps, 'color' | 'disabled' | 'id' | 'value'>,
    VariantProps<typeof ratingGroup> {
  disabledToast?: string
  id: string | number
  label?: string | ((n: number) => string)
  value?: string | number
}

export const RatingGroup = ({
  className,
  color,
  disabled,
  disabledToast,
  id,
  label,
  value,
  ...props
}: RatingGroupProps) => {
  const labelStyles = useMemo(() => ratingGroup({ color, disabled }), [color, disabled])

  const handleClick = useCallback(
    (rating: number) => () => {
      if (!disabled || !disabledToast || value === rating) return
      toast.info(disabledToast, {
        duration: 1200,
      })
    },
    [disabled, disabledToast, value],
  )

  return (
    <RadioGroup className={cn('flex justify-between', className)} value={String(value)} {...props}>
      {[1, 2, 3, 4, 5].map(rating => (
        <div className="flex flex-col items-center gap-2" key={rating}>
          <RadioGroupItem className="peer sr-only" id={`${id}-${rating}`} value={rating.toString()} />
          <Label className={labelStyles} htmlFor={`${id}-${rating}`} onClick={handleClick(rating)}>
            {rating}
          </Label>
          {label && (
            <span className="text-xs text-muted-foreground">{typeof label === 'function' ? label(rating) : label}</span>
          )}
        </div>
      ))}
    </RadioGroup>
  )
}

export const ratingGroup = cva('flex size-10 cursor-pointer items-center justify-center rounded-full border-[1.5px]', {
  defaultVariants: {
    color: 'default',
    disabled: false,
  },
  variants: {
    color: {
      default: 'peer-data-[state=checked]:bg-muted peer-data-[state=checked]:text-muted-foreground',
      brand:
        'peer-data-[state=checked]:border-brand peer-data-[state=checked]:bg-brand peer-data-[state=checked]:text-brand-foreground',
      'brand-secondary': `
          peer-data-[state=checked]:border-brand-secondary peer-data-[state=checked]:bg-brand-secondary
          peer-data-[state=checked]:text-brand-secondary-foreground
        `,
    },
    disabled: {
      true: 'cursor-default opacity-100',
      false: 'hover:cursor-pointer',
    },
  },
  compoundVariants: [
    {
      disabled: false,
      color: 'default',
      className: 'hover:bg-muted',
    },
    {
      disabled: false,
      color: 'brand',
      className: 'hover:border-brand',
    },
    {
      disabled: false,
      color: 'brand-secondary',
      className: 'hover:border-brand-secondary-accent',
    },
  ],
})
