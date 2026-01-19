'use client'

import { useTranslations } from 'next-intl'

import { ErrorPage } from '@/components/layout/error-page'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

export default () => {
  const t = useTranslations('Certificates')

  return (
    <ErrorPage message={t('notFoundMessage')} title={t('notFound')} type="not-found">
      <Button asChild size="lg" variant="outline">
        <Link href="/certificates">{t('backTo')}</Link>
      </Button>
    </ErrorPage>
  )
}
