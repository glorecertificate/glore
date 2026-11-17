import React, { Fragment, Suspense } from 'react'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DynamicMarker } from '@/components/layout/dynamic-marker'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { type NavigationId } from '@/components/layout/navigation'
import { Main } from '@/components/ui/main'

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
      {header ?? <DashboardHeader breadcrumb={breadcrumb} description={description} parent={parent} title={title} />}
      <Main {...props}>
        {fallback === null ? children : <Suspense fallback={fallback ?? <LoadingFallback />}>{children}</Suspense>}
      </Main>
      <DynamicMarker />
    </Provider>
  )
}
