'use client'

import { useEffect } from 'react'

import { ErrorView, type ErrorProps } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { usePathname } from '@/hooks/use-pathname'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'

export default ({ error, reset }: ErrorProps) => {
  const { pathname } = usePathname()
  const t = useTranslations('Common')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorView
      actions={
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
  )
}
