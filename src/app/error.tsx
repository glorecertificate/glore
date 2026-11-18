'use client'

import { BrandShell } from '@/components/features/auth/brand-shell'
import { ErrorActions } from '@/components/layout/error-actions'
import { ErrorFallback, type ErrorProps } from '@/components/layout/error-fallback'
import { Card } from '@/components/ui/card'

const AppError = (props: ErrorProps) => (
  <BrandShell>
    <Card className="p-0">
      <ErrorFallback className="min-h-0 bg-transparent py-12">
        <ErrorActions {...props} />
      </ErrorFallback>
    </Card>
  </BrandShell>
)

export default AppError
