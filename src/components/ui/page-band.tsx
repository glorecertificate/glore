import { cn } from '@/lib/utils'

export const PageBandGlobe = ({ className, ...props }: React.ComponentProps<'svg'>) => (
  <svg
    aria-hidden
    className={cn(
      'pointer-events-none absolute -top-24 -right-16 size-105 text-band-foreground opacity-20 sm:size-110',
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

export const PageBand = ({ children, className, ...props }: React.ComponentProps<'header'>) => (
  <header
    className={cn(
      'relative isolate shrink-0 overflow-hidden bg-band text-band-foreground band-scope has-[+main:not([data-overlap])]:[&>div]:pb-10',
      className
    )}
    data-slot="page-band"
    {...props}
  >
    <PageBandGlobe />
    <div className="relative mx-auto flex w-full max-w-310 flex-col gap-3 px-page pt-5 pb-24 sm:pt-7">{children}</div>
  </header>
)
