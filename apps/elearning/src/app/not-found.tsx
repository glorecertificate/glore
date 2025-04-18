'use client'

import { ErrorView } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'

export default () => {
  const t = useTranslations('Common')

  return (
    <ErrorView
      actions={
        <Button asChild size="lg" variant="outline">
          <Link href={Route.Home}>{t('backToHome')}</Link>
        </Button>
      }
      type="not-found"
    />
  )
}
