'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { type ComponentType, startTransition, useEffect, useState } from 'react'

import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { useSession } from '@/components/providers/session'
import { type User } from '@/db/queries/user'

import { OrganizationCertificatesPanel } from './certificates-panel'
import { OrganizationOverview } from './overview'
import { TabBoundary } from './tab-boundary'
import { useOrganizationTab } from './tabs'

const TabLoading = () => <LoadingFallback className="min-h-64" />

interface LazyTab<P extends object> {
  Dynamic: ComponentType<P>
  load: () => Promise<ComponentType<P>>
  preload: () => Promise<void>
  reset: () => void
  resolved: ComponentType<P> | null
}

const createLazyTab = <P extends object>(load: () => Promise<ComponentType<P>>, initial: ComponentType<P>) => {
  const tab: LazyTab<P> = {
    Dynamic: initial,
    load,
    async preload() {
      if (tab.resolved) return
      try {
        tab.resolved = await load()
      } catch {
        tab.resolved = null
      }
    },
    reset() {
      tab.resolved = null
      tab.Dynamic = dynamic(load, { loading: TabLoading })
    },
    resolved: null,
  }
  return tab
}

const activityTab = createLazyTab(
  async () => (await import('./activity')).OrganizationActivity,
  dynamic(async () => (await import('./activity')).OrganizationActivity, { loading: TabLoading })
)
const insightsTab = createLazyTab(
  async () => (await import('./insights')).OrganizationInsightsPanel,
  dynamic(async () => (await import('./insights')).OrganizationInsightsPanel, { loading: TabLoading })
)
const invitationsTab = createLazyTab(
  async () => (await import('./invitations')).OrganizationInvitations,
  dynamic(async () => (await import('./invitations')).OrganizationInvitations, { loading: TabLoading })
)
const joinRequestsTab = createLazyTab(
  async () => (await import('./join-requests')).OrganizationJoinRequests,
  dynamic(async () => (await import('./join-requests')).OrganizationJoinRequests, { loading: TabLoading })
)
const membersTab = createLazyTab(
  async () => (await import('./members')).OrganizationMembers,
  dynamic(async () => (await import('./members')).OrganizationMembers, { loading: TabLoading })
)
const settingsTab = createLazyTab(
  async () => (await import('./settings')).OrganizationSettings,
  dynamic(async () => (await import('./settings')).OrganizationSettings, { loading: TabLoading })
)

const LAZY_TABS = [activityTab, insightsTab, invitationsTab, joinRequestsTab, membersTab, settingsTab]

const LazyTabHost = <P extends object>({ lazy, ...props }: P & { lazy: LazyTab<P> }) => {
  const [attempt, setAttempt] = useState(0)
  const [Component, setComponent] = useState(() => lazy.resolved ?? lazy.Dynamic)

  const retry = () => {
    lazy.reset()
    setComponent(() => lazy.Dynamic)
    setAttempt(current => current + 1)
  }

  return (
    <TabBoundary key={attempt} onRetry={retry}>
      <Component {...(props as unknown as P)} />
    </TabBoundary>
  )
}

export const OrganizationPanel = ({ initialData }: { initialData: OrganizationPanelData }) => {
  const { refresh: routerRefresh } = useRouter()
  const { organization, setOrganization, setUser } = useSession()
  const { setTab, tab } = useOrganizationTab()

  const data = initialData

  useEffect(() => {
    for (const lazy of LAZY_TABS) void lazy.preload()
  }, [])

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
    return <LazyTabHost joinRequests={data.joinRequests} lazy={joinRequestsTab} onRefresh={refresh} />
  }

  if (currentTab === 'certificates') {
    return <OrganizationCertificatesPanel organizationId={data.organization.id} />
  }

  if (currentTab === 'insights') {
    return <LazyTabHost lazy={insightsTab} />
  }

  if (currentTab === 'activity') {
    return <LazyTabHost initial={data.activity} lazy={activityTab} />
  }

  if (currentTab === 'settings' && data.isOrgAdmin) {
    return (
      <LazyTabHost
        lazy={settingsTab}
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
