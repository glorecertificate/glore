import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { PageBandGlobe } from '@/components/ui/page-band'
import { cn } from '@/lib/utils'

const WIDTHS = { lg: 'max-w-4xl', md: 'max-w-3xl', sm: 'max-w-md', xs: 'max-w-xl' } as const

export const BrandShell = ({
  actions,
  children,
  className,
  description,
  size = 'md',
  title,
  ...props
}: Omit<React.ComponentProps<'div'>, 'title'> & {
  actions?: React.ReactNode
  description?: React.ReactNode
  size?: keyof typeof WIDTHS
  title?: React.ReactNode
}) => (
  <div className={cn('min-h-svh bg-canvas', className)} data-slot="brand-shell" {...props}>
    <header className="relative isolate overflow-hidden bg-band text-band-foreground band-scope">
      <PageBandGlobe />
      <div className={cn('relative mx-auto flex w-full flex-col gap-6 px-page pt-5 pb-24 sm:pt-7', WIDTHS[size])}>
        <div className="flex min-h-8 items-center justify-between gap-4">
          <Link href="/" className="inline-flex rounded-md px-2 py-1">
            <Logo className="h-7 w-auto" />
          </Link>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {(title || description) && (
          <div className="flex flex-col gap-2">
            {title && <h1 className="type-band text-band-foreground">{title}</h1>}
            {description && <p className="max-w-prose text-base text-pretty text-band-text">{description}</p>}
          </div>
        )}
      </div>
    </header>
    <main className={cn('relative mx-auto -mt-16 flex w-full flex-col gap-6 px-page pb-12', WIDTHS[size])}>
      {children}
    </main>
  </div>
)
