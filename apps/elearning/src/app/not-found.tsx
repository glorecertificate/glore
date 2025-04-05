'use client'

import { useTranslations } from 'next-intl'

import { ErrorView } from '@/components/common/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Route } from '@/lib/navigation'

export default () => {
  const t = useTranslations('Common')

  return (
    <ErrorView
      Actions={
        <Link href={Route.Home}>
          <Button size="lg" variant="outline">
            {t('backToHome')}
          </Button>
        </Link>
      }
      type="not-found"
    />
  )
}
