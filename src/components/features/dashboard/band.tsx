import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'

import { loadDashboard } from '@/actions/dashboard/load'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { PageTitle } from '@/components/layout/page-title'

const DashboardBandContent = async () => {
  const data = await loadDashboard()
  const t = await getTranslations('Dashboard')

  if (data.view === 'none') return <DashboardHeader title={t('none.title', { name: data.firstName })} />
  if (data.view === 'volunteer') return <DashboardHeader title={t('greeting', { name: data.firstName })} />
  return <DashboardHeader title={<PageTitle name="dashboard" namespace="Layout" />} />
}

export const DashboardBand = () => (
  <Suspense fallback={<DashboardHeader title={<PageTitle name="dashboard" namespace="Layout" />} />}>
    <DashboardBandContent />
  </Suspense>
)
