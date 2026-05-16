'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useState } from 'react'

import { ArrowLeftIcon, RefreshCwIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ErrorFallback, type ErrorProps } from '@/components/layout/error-fallback'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { Spinner } from '@/components/ui/spinner'
import { APP_ROOT } from '@/lib/constants'

const Error = ({ error, reset }: ErrorProps) => {
  const pathname = usePathname()
  const { back, push } = useRouter()
  const t = useTranslations('Common')

  const [retrying, setRetrying] = useState(false)

  const canGoBack = document.referrer?.startsWith(window.location.origin) && document.referrer !== window.location.href
  const backAction = canGoBack ? back : () => push(APP_ROOT)

  const logError = useEffectEvent(() => {
    if (error) {
      console.error(error)
    }
  })

  useEffect(() => {
    logError()
    return () => setRetrying(false)
  }, [])

  return (
    <>
      <header className="flex h-16 w-full items-center justify-center px-4">
        <Link href={APP_ROOT} title={t('backToHome')}>
          <Logo className="mt-8 h-8" />
        </Link>
      </header>
      <ErrorFallback className="min-h-[calc(100vh-4rem)]">
        {pathname !== APP_ROOT && (
          <Button
            onClick={backAction}
            size="lg"
            variant="outline"
            effect="expandIcon"
            icon={ArrowLeftIcon}
            iconPlacement="left"
          >
            {t(canGoBack ? 'backToPrevious' : 'backToHome')}
          </Button>
        )}
        <Button
          onClick={() => {
            if (!retrying) {
              setRetrying(true)
              setTimeout(() => reset?.(), 600)
            }
          }}
          size="lg"
          variant="outline"
        >
          {t('refreshPage')}
          {retrying ? <Spinner /> : <RefreshCwIcon />}
        </Button>
      </ErrorFallback>
    </>
  )
}

export default Error
