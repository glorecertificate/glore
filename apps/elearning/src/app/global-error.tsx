'use client'

import { usePathname } from 'next/navigation'

import { useTranslations } from 'next-intl'

import { ErrorView, type ErrorProps } from '@/components/common/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Path } from '@/lib/navigation'

export default ({ reset }: ErrorProps) => {
  const pathname = usePathname() as Path
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
              {pathname !== Path.Home && (
                <Link href={Path.Home} passHref>
                  <Button size="lg" variant="outline">
                    {t('backToHome')}
                  </Button>
                </Link>
              )}
            </>
          }
          hasHeader
        />
      </body>
    </html>
  )
}
