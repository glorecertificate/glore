import { Link as EmailLink, type LinkProps as EmailLinkProps } from '@react-email/components'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@glore/mailer/utils'

export interface LinkProps extends EmailLinkProps, VariantProps<typeof linkVariants> {
  href: string
}

export const Link = ({ className, variant, ...props }: LinkProps) => (
  <EmailLink className={cn(linkVariants({ variant }), className)} {...props} />
)

export const linkVariants = cva(null, {
  defaultVariants: {
    variant: 'brand',
  },
  variants: {
    variant: {
      brand: 'text-brand',
      wrapper: null,
    },
  },
})
