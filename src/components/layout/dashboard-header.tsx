import { Suspense } from 'react'

import { type NavigationId, navigationHref } from '@/components/layout/navigation'
import { NavigationLabel } from '@/components/layout/navigation-label'
import { Header, HeaderBreadcrumb, HeaderLogo, HeaderTrigger } from '@/components/ui/header'
import { Logo } from '@/components/ui/logo'
import { APP_ROOT } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const DashboardHeader = ({
  breadcrumb,
  description,
  parent,
  title,
}: {
  breadcrumb?: React.ReactNode
  description?: React.ReactNode
  parent?: NavigationId
  title?: React.ReactNode
}) => {
  const barTitle = title && <Suspense>{title}</Suspense>

  return (
    <Header>
      <div className="flex min-h-9 min-w-0 flex-1 items-center gap-2.5">
        <HeaderTrigger />
        {breadcrumb ?? (
          <HeaderBreadcrumb
            backHref={parent && navigationHref(parent)}
            backLabel={parent && <NavigationLabel id={parent} />}
            description={description}
            title={barTitle}
          />
        )}
        {breadcrumb && title && <h1 className="sr-only">{barTitle}</h1>}
      </div>
      <HeaderLogo className={cn((breadcrumb || parent) && 'max-sm:hidden')} href={APP_ROOT} prefetch={false}>
        <Logo className="mr-1 w-18 transition-[width,height]" />
      </HeaderLogo>
    </Header>
  )
}
