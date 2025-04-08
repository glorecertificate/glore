'use client'

import { useTranslations } from 'next-intl'

import { ErrorView, type ErrorProps } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { usePathname } from '@/hooks/use-pathname'
import { Route } from '@/lib/navigation'

export default ({ reset }: ErrorProps) => {
  const pathname = usePathname()
  const t = useTranslations('Common')

  return (
    <html>
      <body>
        <ErrorView
          Actions={
            <>
              <Button onClick={reset} size="lg" variant="outline">
                {t('tryAgain')}
              </Button>
              {pathname !== Route.Home && (
                <Button asChild size="lg" variant="outline">
                  <Link href={Route.Home}>{t('backToHome')}</Link>
                </Button>
              )}
            </>
          }
          hasHeader
        />
      </body>
    </html>
  )
}
