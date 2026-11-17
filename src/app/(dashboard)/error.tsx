'use client'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { ErrorActions } from '@/components/layout/error-actions'
import { ErrorFallback, type ErrorProps } from '@/components/layout/error-fallback'
import { Main } from '@/components/ui/main'

const DashboardError = (props: ErrorProps) => (
  <>
    <DashboardHeader />
    <Main>
      <ErrorFallback className="flex-1">
        <ErrorActions {...props} />
      </ErrorFallback>
    </Main>
  </>
)

export default DashboardError
