'use client'

import { useTranslations } from 'next-intl'

import { ErrorFallback } from '@/components/layout/error-fallback'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

export default () => {
  const t = useTranslations('Courses')

  return (
    <ErrorFallback message={t('notFoundMessage')} title={t('notFound')} type="not-found">
      <Button asChild size="lg" variant="outline">
        <Link href="/courses">{t('backTo')}</Link>
      </Button>
    </ErrorFallback>
  )
}
