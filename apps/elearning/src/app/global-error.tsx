'use client'

import { useTranslations } from 'next-intl'

import { ErrorView, type ErrorProps } from '@/components/common/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Route } from '@/lib/navigation'

export default ({ reset }: ErrorProps) => {
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
              <Link href={Route.Home} passHref>
                <Button size="lg" variant="outline">
                  {t('backToHome')}
                </Button>
              </Link>
            </>
          }
          hasHeader
        />
      </body>
    </html>
  )
}
