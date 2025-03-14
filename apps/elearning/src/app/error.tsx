'use client'

import { useEffect } from 'react'

import { useTranslations } from 'next-intl'

export interface ErrorProps {
  error: { digest?: string } & Error
  reset: () => void
}

export default ({ error, reset }: ErrorProps) => {
  const t = useTranslations('Common')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>{t('errorMessage')}</h2>
      <button
        onClick={() => {
          reset()
        }}
      >
        {t('tryAgain')}
      </button>
    </div>
  )
}
