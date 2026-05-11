'use client'

import { useTranslations } from 'next-intl'

import { ErrorFallback } from '@/components/layout/error-fallback'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import appConfig from '~/config/metadata.json'

const UserNotFound = () => {
  const t = useTranslations('Certificates')

  return (
    <ErrorFallback message={t('publicNotFoundMessage')} title={t('publicNotFound')} type="not-found">
      <Button asChild variant="outline">
        <a href={appConfig.website} rel="noopener noreferrer" target="_blank">
          {t('publicJoinButton')}
        </a>
      </Button>
      <Button asChild>
        <Link href="/login">{t('publicAccessApp')}</Link>
      </Button>
    </ErrorFallback>
  )
}

export default UserNotFound
