'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useState } from 'react'

import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { useSession } from '@/components/providers/session'
import { type User } from '@/db/queries/user'

import { OrganizationCertificatesPanel } from './certificates-panel'
import { OrganizationOverview } from './overview'
import { useOrganizationTab } from './tabs'

const loadTabs = async () => {
  const [activity, insights, invitations, joinRequests, members, settings] = await Promise.all([
    import('./activity'),
    import('./insights'),
    import('./invitations'),
    import('./join-requests'),
    import('./members'),
    import('./settings'),
  ])
  return {
    OrganizationActivity: activity.OrganizationActivity,
    OrganizationInsightsPanel: insights.OrganizationInsightsPanel,
    OrganizationInvitations: invitations.OrganizationInvitations,
    OrganizationJoinRequests: joinRequests.OrganizationJoinRequests,
    OrganizationMembers: members.OrganizationMembers,
    OrganizationSettings: settings.OrganizationSettings,
  }
}

type Tabs = Awaited<ReturnType<typeof loadTabs>>

let loadedTabs: Tabs | null = null

export const OrganizationPanel = ({ initialData }: { initialData: OrganizationPanelData }) => {
  const { refresh: routerRefresh } = useRouter()
  const { organization, setOrganization, setUser } = useSession()
  const { setTab, tab } = useOrganizationTab()

  const data = initialData

  const [tabs, setTabs] = useState(loadedTabs)

  useEffect(() => {
    if (tabs) return
    const load = async () => {
      loadedTabs = await loadTabs()
      setTabs(loadedTabs)
    }
    void load()
  }, [tabs])

  const currentTab = !data.isOrgAdmin && tab === 'settings' ? 'overview' : tab

  const refresh = () => {
    startTransition(() => routerRefresh())
  }

  const syncUser = (nextUser: User) => {
    setUser(nextUser)
    const nextOrganization =
      nextUser.organizations.find(({ id }) => id === organization?.id) ?? nextUser.organizations[0]

    if (nextOrganization?.id) {
      setOrganization(nextOrganization.id)
    }
  }

  if (currentTab !== 'overview' && currentTab !== 'certificates' && !tabs) {
    return <LoadingFallback className="min-h-64" />
  }

  if (tabs && currentTab === 'members') {
    return (
      <tabs.OrganizationMembers
        currentUserId={data.currentUserId}
        isOrgAdmin={data.isOrgAdmin}
        members={data.members}
        onRefresh={refresh}
        onSyncUser={syncUser}
        organizationName={data.organization.name}
      />
    )
  }

  if (tabs && currentTab === 'invitations') {
    return (
      <tabs.OrganizationInvitations
        currentUserId={data.currentUserId}
        inviteLinks={data.inviteLinks}
        invitations={data.invitations}
        isOrgAdmin={data.isOrgAdmin}
        onRefresh={refresh}
      />
    )
  }

  if (tabs && currentTab === 'requests') {
    return <tabs.OrganizationJoinRequests joinRequests={data.joinRequests} onRefresh={refresh} />
  }

  if (currentTab === 'certificates') {
    return <OrganizationCertificatesPanel organizationId={data.organization.id} />
  }

  if (tabs && currentTab === 'insights') {
    return <tabs.OrganizationInsightsPanel />
  }

  if (tabs && currentTab === 'activity') {
    return <tabs.OrganizationActivity initial={data.activity} />
  }

  if (tabs && currentTab === 'settings' && data.isOrgAdmin) {
    return (
      <tabs.OrganizationSettings
        key={data.organization.updatedAt}
        members={data.members}
        onRefresh={refresh}
        onSyncUser={syncUser}
        organization={data.organization}
      />
    )
  }

  return <OrganizationOverview data={data} onNavigate={setTab} />
}
