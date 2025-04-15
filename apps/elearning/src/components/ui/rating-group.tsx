import { useCallback, useMemo } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem, type RadioGroupProps } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export interface RatingGroupProps
  extends Omit<RadioGroupProps, 'color' | 'disabled' | 'id' | 'value'>,
    VariantProps<typeof ratingGroup> {
  disabledToast?: string
  id: string | number
  value?: string | number
}

export const RatingGroup = ({ className, color, disabled, disabledToast, id, value, ...props }: RatingGroupProps) => {
  const t = useTranslations('Common')

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
          <span className="text-xs text-muted-foreground">
            {t('ratingLabel', {
              rating: String(rating),
            })}
          </span>
        </div>
      ))}
    </RadioGroup>
  )
}

export const ratingGroup = cva('flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-[1.5px]', {
  defaultVariants: {
    color: 'default',
    disabled: false,
  },
  variants: {
    color: {
      default: 'peer-data-[state=checked]:bg-muted peer-data-[state=checked]:text-muted-foreground',
      primary:
        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground',
      secondary:
        'peer-data-[state=checked]:border-secondary peer-data-[state=checked]:bg-secondary peer-data-[state=checked]:text-secondary-foreground',
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
      color: 'primary',
      className: 'hover:border-primary-accent',
    },
    {
      disabled: false,
      color: 'secondary',
      className: 'hover:border-secondary',
    },
  ],
})
