'use client'

import { useTranslations } from 'next-intl'

import { ErrorView } from '@/components/error-view'
import { DashboardButton } from '@/components/layout/dashboard-button'
import { Route } from '@/lib/navigation'
import { SemanticColor } from '@/lib/theme'

export default () => {
  const t = useTranslations('Certificates')

  return (
    <ErrorView
      Actions={
        <DashboardButton color={SemanticColor.Secondary} size="lg" to={Route.Certificates} variant="outline">
          {t('backTo')}
        </DashboardButton>
      }
      message={t('notFoundMessage')}
      title={t('notFound')}
      type="not-found"
    />
  )
}
