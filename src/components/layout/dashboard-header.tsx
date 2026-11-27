import { Suspense } from 'react'

import { LucideIcon } from '@/components/icons/lucide'
import { DashboardMenuButton } from '@/components/layout/dashboard-menu-button'
import { type NavigationId, navigationHref } from '@/components/layout/navigation'
import { NavigationLabel } from '@/components/layout/navigation-label'
import { HeaderLogo } from '@/components/ui/header'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { PageBand } from '@/components/ui/page-band'
import { APP_ROOT } from '@/lib/constants'

export const DashboardHeader = ({
  actions,
  breadcrumb,
  description,
  heading,
  parent,
  title,
}: {
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
  description?: React.ReactNode
  heading?: React.ReactNode
  parent?: NavigationId
  title?: React.ReactNode
}) => (
  <PageBand>
    <div className="flex h-10 min-w-0 items-center gap-2 text-[13px] text-band-muted">
      <DashboardMenuButton className="text-band-muted hover:bg-band-scrim hover:text-band-foreground" />
      {parent && (
        <>
          <span aria-hidden className="mr-1.5 h-4 w-px bg-band-border" />
          <Link className="text-sm hover:text-band-foreground" href={navigationHref(parent)}>
            <NavigationLabel id={parent} />
          </Link>
          <LucideIcon className="size-3.5" name="chevron-right" />
          <span className="truncate text-sm text-band-foreground">{title && <Suspense>{title}</Suspense>}</span>
        </>
      )}
      <HeaderLogo className="ml-auto inline-flex md:hidden" href={APP_ROOT} prefetch={false}>
        <Logo className="h-5 w-auto" />
      </HeaderLogo>
    </div>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 grow flex-col gap-2">
        {(heading ?? title) && (
          <h1 className="type-band text-band-foreground">{heading ?? <Suspense>{title}</Suspense>}</h1>
        )}
        {description && <p className="max-w-prose text-base text-pretty text-band-text">{description}</p>}
      </div>
      {actions && <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {breadcrumb && <div className="min-w-0 band-tabs">{breadcrumb}</div>}
  </PageBand>
)
