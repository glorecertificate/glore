'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo } from 'react'

import { log } from '@repo/utils/logger'

import { ErrorView, type ErrorProps } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/icons/logo'
import { Link } from '@/components/ui/link'
import { usePathname } from '@/hooks/use-pathname'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'

export default ({ error }: ErrorProps) => {
  const { pathname } = usePathname()
  const router = useRouter()
  const t = useTranslations('Common')

  useEffect(() => {
    log.error(error)
  }, [error])

  const canGoBack = useMemo(() => {
    const previousUrl = document.referrer
    return previousUrl && previousUrl.startsWith(window.location.origin) && previousUrl !== window.location.href
  }, [])

  const onBackClick = useCallback(() => {
    router.back()
  }, [router])

  const reload = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <ErrorView
      className="min-h-[calc(100vh-4rem)]"
      header={
        <header className="flex h-16 w-full items-center justify-center px-4">
          <Link href={Route.Home} title={t('backToHome')}>
            <Logo className="mt-8 h-8" />
          </Link>
        </header>
      }
    >
      {canGoBack ? (
        <Button onClick={onBackClick} size="lg" variant="outline">
          {t('backToPrevious')}
        </Button>
      ) : (
        pathname !== Route.Home && (
          <Button asChild size="lg" variant="outline">
            {t('backToHome')}
          </Button>
        )
      )}
      <Button onClick={reload} size="lg" variant="outline">
        {t('refreshPage')}
      </Button>
    </ErrorView>
  )
}
