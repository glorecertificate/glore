import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const bannerVariants = cva('flex items-start gap-3 rounded-lg border p-4 text-sm', {
  defaultVariants: { variant: 'info' },
  variants: {
    variant: {
      info: 'border-border bg-muted/40 text-foreground',
      success: 'border-success/30 bg-success/10 text-foreground',
      warning: 'border-warning/30 bg-warning/10 text-foreground',
      destructive: 'border-destructive/30 bg-destructive/10 text-foreground',
    },
  },
})

export const Banner = ({
  className,
  role = 'status',
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof bannerVariants>) => (
  <div className={cn(bannerVariants({ variant }), className)} data-slot="banner" role={role} {...props} />
)
