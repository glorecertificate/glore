import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const bannerVariants = cva('flex items-start gap-3 rounded-lg border p-4 text-sm', {
  defaultVariants: { variant: 'info' },
  variants: {
    variant: {
      info: 'border-info-border bg-info-subtle text-foreground',
      success: 'border-success-border bg-success-subtle text-foreground',
      warning: 'border-warning-border bg-warning-subtle text-foreground',
      destructive: 'border-danger-border bg-danger-subtle text-foreground',
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
