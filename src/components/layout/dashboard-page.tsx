import React, { Fragment, Suspense } from 'react'

import { DynamicMarker } from '@/components/layout/dynamic-marker'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { type NavigationId, navigationHref } from '@/components/layout/navigation'
import { NavigationLabel } from '@/components/layout/navigation-label'
import { Header, HeaderBreadcrumb, HeaderLogo, HeaderTrigger } from '@/components/ui/header'
import { Logo } from '@/components/ui/logo'
import { Main } from '@/components/ui/main'
import { APP_ROOT } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const DashboardPage = ({
  breadcrumb,
  children,
  description,
  header,
  fallback,
  parent,
  provider,
  title,
  ...props
}: Omit<React.ComponentProps<typeof Main>, 'title'> & {
  breadcrumb?: React.ReactNode
  description?: React.ReactNode
  header?: React.ReactNode
  fallback?: React.ReactNode
  parent?: NavigationId
  provider?: React.ComponentType
  title?: React.ReactNode
}) => {
  const Provider = provider ?? Fragment

  return (
    <Provider>
      {header ?? (
        <Header>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <HeaderTrigger />
            {breadcrumb ?? (
              <HeaderBreadcrumb
                backHref={parent && navigationHref(parent)}
                backLabel={parent && <NavigationLabel id={parent} />}
                description={description}
                title={title}
              />
            )}
            {breadcrumb && title && <h1 className="sr-only">{title}</h1>}
          </div>
          <HeaderLogo className={cn((breadcrumb || parent) && 'max-sm:hidden')} href={APP_ROOT}>
            <Logo className="mr-1 w-18 transition-[width,height]" />
          </HeaderLogo>
        </Header>
      )}
      <Main {...props}>
        {fallback === null ? children : <Suspense fallback={fallback ?? <LoadingFallback />}>{children}</Suspense>}
      </Main>
      <DynamicMarker />
    </Provider>
  )
}
