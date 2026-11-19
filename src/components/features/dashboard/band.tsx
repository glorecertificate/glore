import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'

import { loadDashboard } from '@/actions/dashboard/load'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { PageTitle } from '@/components/layout/page-title'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

const DashboardBandContent = async () => {
  const [data, t, tSearch] = await Promise.all([
    loadDashboard(),
    getTranslations('Dashboard'),
    getTranslations('Search'),
  ])

  if (data.view === 'none') return <DashboardHeader title={t('none.title', { name: data.firstName })} />
  if (data.view === 'manager') {
    return (
      <DashboardHeader
        actions={
          <Button asChild icon="user-plus" variant="band">
            <Link href="/organization?tab=invitations">{tSearch('inviteMembers')}</Link>
          </Button>
        }
        title={<PageTitle name="dashboard" namespace="Layout" />}
      />
    )
  }
  return <DashboardHeader title={<PageTitle name="dashboard" namespace="Layout" />} />
}

export const DashboardBand = () => (
  <Suspense fallback={<DashboardHeader title={<PageTitle name="dashboard" namespace="Layout" />} />}>
    <DashboardBandContent />
  </Suspense>
)
