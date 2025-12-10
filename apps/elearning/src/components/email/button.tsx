import { Button, type ButtonProps } from '@react-email/components'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export interface EmailButtonProps extends ButtonProps, VariantProps<typeof buttonVariants> {}

export const EmailButton = ({ className, variant, ...props }: EmailButtonProps) => (
  <Button className={cn(buttonVariants({ variant }), className)} {...props} />
)

export const buttonVariants = cva('rounded-md px-[18px] py-3 font-medium', {
  variants: {
    variant: {
      brand: 'bg-brand text-white',
      success: 'bg-success text-white',
    },
  },
  defaultVariants: {
    variant: 'brand',
  },
})
