'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useState, useSyncExternalStore } from 'react'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { type ErrorProps } from '@/components/layout/error-fallback'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { APP_ROOT } from '@/lib/constants'

const subscribe = () => () => {}
const getCanGoBack = () =>
  document.referrer.startsWith(window.location.origin) && document.referrer !== window.location.href
const getServerCanGoBack = () => false

export const ErrorActions = ({ error, reset }: ErrorProps) => {
  const pathname = usePathname()
  const { back, push } = useRouter()
  const t = useTranslations('Common')

  const [retrying, setRetrying] = useState(false)

  const canGoBack = useSyncExternalStore(subscribe, getCanGoBack, getServerCanGoBack)
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
      {pathname !== APP_ROOT && (
        <Button
          onClick={backAction}
          size="lg"
          variant="outline"
          effect="expandIcon"
          icon="arrow-left"
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
        {retrying ? <Spinner /> : <LucideIcon name="refresh-cw" />}
      </Button>
    </>
  )
}
