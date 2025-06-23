'use client'

import { ErrorView } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'

export default () => {
  const t = useTranslations('Courses')

  return (
    <ErrorView message={t('notFoundMessage')} title={t('notFound')} type="not-found">
      <Button asChild size="lg" variant="outline">
        <Link href={Route.Courses}>{t('backTo')}</Link>
      </Button>
    </ErrorView>
  )
}
