import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const bannerVariants = cva('flex items-start gap-3 rounded-lg border bg-card bg-linear-to-b p-4 text-sm shadow-card', {
  defaultVariants: { variant: 'info' },
  variants: {
    variant: {
      info: 'border-info-border from-info-subtle to-info-subtle text-foreground',
      success: 'border-success-border from-success-subtle to-success-subtle text-foreground',
      warning: 'border-warning-border from-warning-subtle to-warning-subtle text-foreground',
      destructive: 'border-danger-border from-danger-subtle to-danger-subtle text-foreground',
    },
  },
})

export const Banner = ({
  className,
  role,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof bannerVariants>) => (
  <div
    className={cn(bannerVariants({ variant }), className)}
    data-slot="banner"
    role={role ?? (variant === 'destructive' ? 'alert' : 'status')}
    {...props}
  />
)
