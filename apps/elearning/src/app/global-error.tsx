'use client'

import { useMemo } from 'react'

import { useTranslations } from 'next-intl'

import AppError, { type ErrorProps } from '@/components/app-error'
import app from 'config/app.json'

export default ({ reset }: ErrorProps) => {
  const t = useTranslations('Common')

  const message = useMemo(
    () =>
      t.rich('errorMessage', {
        contactUs: content => (
          <a className="text-primary underline" href={`mailto:${app.email}`}>
            {content}
          </a>
        ),
      }),
    [t],
  )

  return (
    <html>
      <body>
        <AppError action={reset} actionLabel={t('tryAgain')} assetWidth={300} message={message} title={t('errorTitle')} />
      </body>
    </html>
  )
}
