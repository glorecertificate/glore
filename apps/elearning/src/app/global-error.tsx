'use client'

import { useTranslations } from 'next-intl'

export default ({ reset }: { reset: () => void }) => {
  const t = useTranslations('Common')

  return (
    <html>
      <body className="flex h-screen w-screen items-center justify-center">
        <h1>{t('errorTitle')}</h1>
        <p>{t('errorMessage')}</p>
        <button
          onClick={() => {
            reset()
          }}
        >
          {t('tryAgain')}
        </button>
      </body>
    </html>
  )
}
