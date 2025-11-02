'use client'

import { useTranslations } from 'next-intl'

import { ErrorView } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { useHeader } from '@/hooks/use-header'

export default () => {
  const t = useTranslations('Courses')

  useHeader(null)

  return (
    <ErrorView message={t('notFoundMessage')} title={t('notFound')} type="not-found">
      <Button asChild size="lg" variant="outline">
        <Link href="/courses">{t('backTo')}</Link>
      </Button>
    </ErrorView>
  )
}
