'use client'

import { useEffect } from 'react'

import { useTranslations } from 'next-intl'

import app from 'static/app.json'

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
      <h2>
        {t.rich('errorMessage', {
          contactUs: content => (
            <a className="text-primary underline" href={`mailto:${app.email}`}>
              {content}
            </a>
          ),
        })}
      </h2>
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
