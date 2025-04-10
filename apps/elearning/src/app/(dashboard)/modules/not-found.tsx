'use client'

import { useTranslations } from 'next-intl'

import { ErrorView } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Route } from '@/lib/navigation'

export default () => {
  const t = useTranslations('Modules')

  return (
    <ErrorView
      Actions={
        <Button asChild size="lg" variant="outline">
          <Link href={Route.Modules}>{t('backTo')}</Link>
        </Button>
      }
      message={t('notFoundMessage')}
      title={t('notFound')}
      type="not-found"
    />
  )
}
