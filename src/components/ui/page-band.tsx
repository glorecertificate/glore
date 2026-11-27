import { MAIN_WIDTHS, type MainWidth } from '@/components/ui/main'
import { cn } from '@/lib/utils'

export const PageBandGlobe = ({ className, ...props }: React.ComponentProps<'svg'>) => (
  <svg
    aria-hidden
    className={cn(
      'pointer-events-none absolute -top-24 -right-16 size-105 text-band-globe opacity-globe sm:size-110',
      className
    )}
    data-slot="page-band-globe"
    viewBox="0 0 400 400"
    {...props}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="200" cy="200" r="180" />
      <ellipse cx="200" cy="200" rx="180" ry="60" />
      <ellipse cx="200" cy="200" rx="180" ry="120" />
      <ellipse cx="200" cy="200" rx="60" ry="180" />
      <ellipse cx="200" cy="200" rx="120" ry="180" />
      <line x1="20" x2="380" y1="200" y2="200" />
      <line x1="200" x2="200" y1="20" y2="380" />
    </g>
  </svg>
)

export const PageBand = ({
  children,
  className,
  width = 'full',
  ...props
}: React.ComponentProps<'header'> & { width?: MainWidth }) => (
  <header
    className={cn(
      'relative isolate shrink-0 overflow-hidden bg-band text-band-foreground band-scope has-[+main:not([data-overlap])]:[&>div]:pb-10',
      className
    )}
    data-slot="page-band"
    {...props}
  >
    <div className="relative mx-auto w-full max-w-320 px-page pt-4 pb-24">
      <div className={cn('flex w-full flex-col gap-3', MAIN_WIDTHS[width])}>{children}</div>
    </div>
  </header>
)
