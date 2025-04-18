'use client'

import { ErrorView, type ErrorProps } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Route } from '@/lib/navigation'

export default ({ reset }: ErrorProps) => (
  <html>
    <body>
      <ErrorView
        actions={
          <>
            <Button onClick={reset} size="lg" variant="outline">
              {'Reset'}
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={Route.Home}>{'Home'}</Link>
            </Button>
          </>
        }
        hasHeader
      />
    </body>
  </html>
)
