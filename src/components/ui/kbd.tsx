import { cn } from '@/lib/utils'

export const Kbd = ({ className, ...props }: React.ComponentProps<'kbd'>) => (
  <kbd
    className={cn(
      'pointer-events-none inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-muted px-1 font-sans text-xs leading-none font-medium text-fg-2 select-none pointer-coarse:hidden',
      'in-data-[slot=tooltip-content]:border-background/20 in-data-[slot=tooltip-content]:bg-background/15 in-data-[slot=tooltip-content]:text-background',
      className
    )}
    data-slot="kbd"
    {...props}
  />
)

export const KbdGroup = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    className={cn('inline-flex items-center gap-0.5 pointer-coarse:hidden', className)}
    data-slot="kbd-group"
    {...props}
  />
)
