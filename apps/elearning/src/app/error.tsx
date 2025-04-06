'use client'

import { useEffect } from 'react'

import { useTranslations } from 'next-intl'

import { ErrorView, type ErrorProps } from '@/components/common/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { useNavigation } from '@/hooks/use-navigation'
import { Route } from '@/lib/navigation'

export default ({ error, reset }: ErrorProps) => {
  const { pathname } = useNavigation()
  const t = useTranslations('Common')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorView
      Actions={
        <>
          <Button onClick={reset} size="lg" variant="outline">
            {t('tryAgain')}
          </Button>
          {pathname !== Route.Home && (
            <Link href={Route.Home} passHref>
              <Button size="lg" variant="outline">
                {t('backToHome')}
              </Button>
            </Link>
          )}
        </>
      }
      hasHeader
    />
  )
}
