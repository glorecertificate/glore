import { Route } from 'next'
import React, { Fragment, Suspense } from 'react'

import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Header, HeaderBreadcrumb, HeaderLogo, HeaderTrigger } from '@/components/ui/header'
import { Logo } from '@/components/ui/logo'
import { Main } from '@/components/ui/main'
import { APP_ROOT } from '@/lib/constants'

export const DashboardPage = ({
  backHref,
  breadcrumb,
  children,
  description,
  header,
  fallback,
  provider,
  title,
  ...props
}: React.ComponentProps<typeof Main> & {
  backHref?: Route
  breadcrumb?: React.ReactNode
  description?: React.ReactNode
  header?: React.ReactNode
  fallback?: React.ReactNode
  provider?: React.ComponentType
  title?: React.ReactNode
}) => {
  const Provider = provider ?? Fragment

  return (
    <Provider>
      {header ?? (
        <Header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HeaderTrigger />
            {breadcrumb ?? <HeaderBreadcrumb description={description} title={title} backHref={backHref} />}
          </div>
          <HeaderLogo href={APP_ROOT}>
            <Logo className="mr-1 w-18 transition-[width,height]" />
          </HeaderLogo>
        </Header>
      )}
      <Main {...props}>
        {fallback === null ? children : <Suspense fallback={fallback ?? <LoadingFallback />}>{children}</Suspense>}
      </Main>
    </Provider>
  )
}
