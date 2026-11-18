import { Suspense } from 'react'

import { LucideIcon } from '@/components/icons/lucide'
import { type NavigationId, navigationHref } from '@/components/layout/navigation'
import { NavigationLabel } from '@/components/layout/navigation-label'
import { HeaderLogo, HeaderTrigger } from '@/components/ui/header'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { PageBand } from '@/components/ui/page-band'
import { APP_ROOT } from '@/lib/constants'

export const DashboardHeader = ({
  actions,
  breadcrumb,
  description,
  parent,
  title,
}: {
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
  description?: React.ReactNode
  parent?: NavigationId
  title?: React.ReactNode
}) => (
  <PageBand>
    <div className="flex min-h-8 min-w-0 items-center gap-2 text-[13px] text-band-muted">
      <HeaderTrigger className="text-band-muted hover:bg-band-scrim hover:text-band-foreground" />
      {parent && (
        <>
          <Link className="hover:text-band-foreground" href={navigationHref(parent)}>
            <NavigationLabel id={parent} />
          </Link>
          <LucideIcon className="size-3.5" name="chevron-right" />
          <span className="truncate text-band-foreground">{title && <Suspense>{title}</Suspense>}</span>
        </>
      )}
      <HeaderLogo
        className="ml-auto inline-flex rounded-md logo-chip px-2 py-1 md:hidden"
        href={APP_ROOT}
        prefetch={false}
      >
        <Logo className="h-4 w-auto" />
      </HeaderLogo>
    </div>
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-col gap-2">
        {title && (
          <h1 className="type-band text-band-foreground">
            <Suspense>{title}</Suspense>
          </h1>
        )}
        {description && <p className="max-w-prose text-base text-pretty text-band-text">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {breadcrumb && <div className="min-w-0 band-tabs">{breadcrumb}</div>}
  </PageBand>
)
