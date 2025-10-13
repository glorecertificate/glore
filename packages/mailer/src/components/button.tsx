import { Button as EmailButton, type ButtonProps as EmailButtonProps } from '@react-email/components'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@glore/mailer/utils'

export interface ButtonProps extends EmailButtonProps, VariantProps<typeof buttonVariants> {}

export const Button = ({ className, variant, ...props }: ButtonProps) => (
  <EmailButton className={cn(buttonVariants({ variant }), className)} {...props} />
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
