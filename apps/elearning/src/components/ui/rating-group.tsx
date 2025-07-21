import { useCallback, useMemo } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'
import { toast } from 'sonner'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem, type RadioGroupProps } from '@/components/ui/radio-group'
import { useTranslations } from '@/hooks/use-translations'
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

export const ratingGroup = cva(
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-[1.5px]',
  {
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
  },
)
