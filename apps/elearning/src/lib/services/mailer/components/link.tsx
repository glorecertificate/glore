import { Link, type LinkProps } from '@react-email/components'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export interface EmailLinkProps extends LinkProps, VariantProps<typeof linkVariants> {
  href: string
}

export const EmailLink = ({ className, variant, ...props }: EmailLinkProps) => (
  <Link className={cn(linkVariants({ variant }), className)} {...props} />
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
