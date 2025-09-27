'use client'

import { useTranslations } from '@repo/i18n'
import { Button } from '@repo/ui/components/button'

import { ErrorView } from '@/components/layout/error-view'
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
