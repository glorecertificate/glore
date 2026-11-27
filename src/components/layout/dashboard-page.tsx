import React, { Fragment, Suspense } from 'react'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DynamicMarker } from '@/components/layout/dynamic-marker'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { type NavigationId } from '@/components/layout/navigation'
import { Main } from '@/components/ui/main'

export const DashboardPage = ({
  actions,
  breadcrumb,
  children,
  description,
  header,
  fallback,
  overlap,
  parent,
  provider,
  title,
  width,
  ...props
}: Omit<React.ComponentProps<typeof Main>, 'title'> & {
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
  description?: React.ReactNode
  header?: React.ReactNode
  fallback?: React.ReactNode
  overlap?: boolean
  parent?: NavigationId
  provider?: React.ComponentType
  title?: React.ReactNode
}) => {
  const Provider = provider ?? Fragment

  return (
    <Provider>
      {header ?? (
        <DashboardHeader
          actions={actions}
          breadcrumb={breadcrumb}
          description={description}
          parent={parent}
          title={title}
          width={width ?? 'full'}
        />
      )}
      <Main overlap={overlap} width={width} {...props}>
        {fallback === null ? children : <Suspense fallback={fallback ?? <LoadingFallback />}>{children}</Suspense>}
      </Main>
      <DynamicMarker />
    </Provider>
  )
}
