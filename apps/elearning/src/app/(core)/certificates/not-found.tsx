'use client'

import { useTranslations } from 'next-intl'

import { ErrorView } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

export default () => {
  const t = useTranslations('Certificates')

  return (
    <ErrorView message={t('notFoundMessage')} title={t('notFound')} type="not-found">
      <Button asChild size="lg" variant="outline">
        <Link href="/certificates">{t('backTo')}</Link>
      </Button>
    </ErrorView>
  )
}
