import Link from 'next/link'

import { LegalLinks } from '@/components/features/legal/legal-links'
import { LanguageSelect } from '@/components/ui/language-select'
import { Logo } from '@/components/ui/logo'
import { AUTH_ROOT } from '@/lib/constants'
import { cn } from '@/lib/utils'

const WIDTHS = { lg: 'max-w-2xl', md: 'max-w-lg', sm: 'max-w-sm' } as const

export const AuthSplit = ({
  children,
  className,
  message,
  size = 'sm',
  title,
  ...props
}: Omit<React.ComponentProps<'div'>, 'title'> & {
  message?: React.ReactNode
  size?: keyof typeof WIDTHS
  title?: React.ReactNode
}) => (
  <div
    className={cn('flex min-h-svh flex-col bg-canvas lg:grid lg:grid-cols-2', className)}
    data-slot="auth-split"
    {...props}
  >
    <aside className="relative isolate flex flex-col gap-6 overflow-hidden bg-band-from px-page pt-5 pb-6 text-band-foreground band-scope lg:min-h-svh lg:justify-between lg:px-12 lg:py-10">
      <div className="flex w-full items-center justify-between gap-4">
        <Link aria-label="GloRe" className="rounded-md outline-none focus-visible:focus-ring" href={AUTH_ROOT}>
          <Logo className="h-8 w-auto" />
        </Link>
        <LanguageSelect className="min-w-28 border-band-border bg-band-scrim text-band-foreground lg:hidden" />
      </div>
      {title && (
        <div className="flex max-w-md flex-col gap-3 lg:mb-auto lg:pt-24">
          <p className="type-title text-balance text-band-foreground">{title}</p>
          {message && <p className="text-pretty text-band-text">{message}</p>}
        </div>
      )}
      <LegalLinks className="hidden text-band-text lg:flex" />
    </aside>
    <div className="flex flex-1 flex-col px-page">
      <div className="hidden justify-end pt-6 lg:flex">
        <LanguageSelect className="min-w-28" />
      </div>
      <main className="flex flex-1 items-center justify-center py-8">
        <div className={cn('flex w-full flex-col gap-6', WIDTHS[size])}>{children}</div>
      </main>
    </div>
  </div>
)
