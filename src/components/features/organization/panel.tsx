'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useState } from 'react'

import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { useSession } from '@/components/providers/session'
import { type User } from '@/db/queries/user'

import { OrganizationCertificatesPanel } from './certificates-panel'
import {
  type LazyTab,
  activityTab,
  insightsTab,
  invitationsTab,
  joinRequestsTab,
  membersTab,
  preloadOrganizationTab,
  settingsTab,
} from './lazy-tabs'
import { OrganizationOverview } from './overview'
import { TabBoundary } from './tab-boundary'
import { useOrganizationTab } from './tab-context'
import { TabSlot } from './tab-slot'

const LazyTabHost = <P extends object>({ lazy, ...props }: P & { lazy: LazyTab<P> }) => {
  const [attempt, setAttempt] = useState(0)

  const retry = () => {
    lazy.reset()
    setAttempt(current => current + 1)
  }

  return (
    <TabBoundary key={attempt} onRetry={retry}>
      <TabSlot lazy={lazy} {...(props as unknown as P)} />
    </TabBoundary>
  )
}

export const OrganizationPanel = ({ initialData }: { initialData: OrganizationPanelData }) => {
  const { refresh: routerRefresh } = useRouter()
  const { organization, setOrganization, setUser } = useSession()
  const { setTab, tab } = useOrganizationTab()

  const data = initialData

  useEffect(() => {
    const scope = { organizationId: data.organization.id, userId: data.currentUserId }
    void preloadOrganizationTab(tab, scope)
    for (const name of ['certificates', 'insights']) void preloadOrganizationTab(name, scope)
  }, [data.currentUserId, data.organization.id, tab])

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

  if (currentTab === 'members') {
    return (
      <LazyTabHost
        key="members"
        lazy={membersTab}
        currentUserId={data.currentUserId}
        isOrgAdmin={data.isOrgAdmin}
        members={data.members}
        onRefresh={refresh}
        onSyncUser={syncUser}
        organizationName={data.organization.name}
      />
    )
  }

  if (currentTab === 'invitations') {
    return (
      <LazyTabHost
        key="invitations"
        lazy={invitationsTab}
        currentUserId={data.currentUserId}
        inviteLinks={data.inviteLinks}
        invitations={data.invitations}
        isOrgAdmin={data.isOrgAdmin}
        onRefresh={refresh}
      />
    )
  }

  if (currentTab === 'requests') {
    return <LazyTabHost key="requests" joinRequests={data.joinRequests} lazy={joinRequestsTab} onRefresh={refresh} />
  }

  if (currentTab === 'certificates') {
    return <OrganizationCertificatesPanel organizationId={data.organization.id} viewerId={data.currentUserId} />
  }

  if (currentTab === 'insights') {
    return (
      <LazyTabHost
        key={`insights-${data.organization.id}`}
        lazy={insightsTab}
        organizationId={data.organization.id}
        viewerId={data.currentUserId}
      />
    )
  }

  if (currentTab === 'activity') {
    return <LazyTabHost key="activity" initial={data.activity} lazy={activityTab} />
  }

  if (currentTab === 'settings' && data.isOrgAdmin) {
    return (
      <LazyTabHost
        lazy={settingsTab}
        key={`settings-${data.organization.updatedAt}`}
        members={data.members}
        onRefresh={refresh}
        onSyncUser={syncUser}
        organization={data.organization}
      />
    )
  }

  return <OrganizationOverview data={data} onNavigate={setTab} />
}
