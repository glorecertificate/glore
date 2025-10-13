'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { GloreIcon } from '@/components/icons/glore'
import { type ErrorProps, ErrorView } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { useNavigation } from '@/hooks/use-navigation'
import { useTranslations } from '@/hooks/use-translations'

export default ({ error }: ErrorProps) => {
  const { pathname, router } = useNavigation()
  const t = useTranslations('Common')

  useEffect(() => {
    console.error(error)
  }, [error])

  const canGoBack = useMemo(() => {
    const previousUrl = document.referrer
    return previousUrl?.startsWith(window.location.origin) && previousUrl !== window.location.href
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
          <Link href="/" title={t('backToHome')}>
            <GloreIcon className="mt-8 h-8" />
          </Link>
        </header>
      }
    >
      {canGoBack ? (
        <Button onClick={onBackClick} size="lg" variant="outline">
          {t('backToPrevious')}
        </Button>
      ) : (
        pathname !== '/' && (
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
