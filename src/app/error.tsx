'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useTranslations } from 'next-intl'

import { GloreIcon } from '@/components/icons/glore'
import { ErrorFallback, type ErrorProps } from '@/components/layout/error-fallback'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { APP_ROOT } from '@/lib/constants'

const Error = ({ error }: ErrorProps) => {
  const pathname = usePathname()
  const { back } = useRouter()
  const t = useTranslations('Common')

  useEffect(() => {
    console.error(error)
  }, [error])

  const header = (
    <header className="flex h-16 w-full items-center justify-center px-4">
      <Link href={APP_ROOT} title={t('backToHome')}>
        <GloreIcon className="mt-8 h-8" />
      </Link>
    </header>
  )

  const canGoBack = document.referrer?.startsWith(window.location.origin) && document.referrer !== window.location.href

  return (
    <ErrorFallback className="min-h-[calc(100vh-4rem)]" header={header}>
      {canGoBack ? (
        <Button
          onClick={() => {
            if (canGoBack) back()
          }}
          size="lg"
          variant="outline"
        >
          {t('backToPrevious')}
        </Button>
      ) : (
        pathname !== APP_ROOT && (
          <Button asChild size="lg" variant="outline">
            {t('backToHome')}
          </Button>
        )
      )}
      <Button onClick={() => window.location.reload()} size="lg" variant="outline">
        {t('refreshPage')}
      </Button>
    </ErrorFallback>
  )
}

export default Error
