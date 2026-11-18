'use client'

import dynamic from 'next/dynamic'
import { type ComponentType } from 'react'

import { type InsightsScope as OrganizationScope } from './insights-cache'
import { type OrganizationTab } from './tab-context'

type SkeletonLoader = () => Promise<ComponentType>

export interface LazyTab<P extends object> {
  Dynamic: ComponentType<P>
  load: () => Promise<ComponentType<P>>
  preload: (scope: OrganizationScope) => Promise<void>
  reset: () => void
  resolved: ComponentType<P> | null
}

const settle = async (scope: OrganizationScope, run?: (scope: OrganizationScope) => Promise<unknown>) => {
  try {
    await run?.(scope)
  } catch (error) {
    console.error(error)
  }
}

const createLazyTab = <P extends object>(
  load: () => Promise<ComponentType<P>>,
  loadSkeleton: SkeletonLoader,
  warm?: (scope: OrganizationScope) => Promise<void>
) => {
  const Skeleton = dynamic(loadSkeleton, { loading: () => null })
  const Loading = () => <Skeleton />
  const tab: LazyTab<P> = {
    Dynamic: dynamic(load, { loading: Loading }),
    load,
    async preload(scope) {
      const warming = settle(scope, warm)
      void settle(scope, loadSkeleton)
      if (!tab.resolved) {
        try {
          tab.resolved = await load()
        } catch {
          tab.resolved = null
        }
      }
      await warming
    },
    reset() {
      tab.resolved = null
      tab.Dynamic = dynamic(load, { loading: Loading })
    },
    resolved: null,
  }
  return tab
}

export const activityTab = createLazyTab(
  async () => (await import('./activity')).OrganizationActivity,
  async () => (await import('./activity-skeleton')).ActivitySkeleton
)
export const insightsTab = createLazyTab(
  async () => (await import('./insights')).OrganizationInsightsPanel,
  async () => (await import('./insights-skeleton')).InsightsSkeleton,
  async scope => {
    const [{ prefetchInsights }, { preloadChart }] = await Promise.all([
      import('./insights'),
      import('@/components/ui/chart'),
    ])
    await Promise.all([prefetchInsights(scope), preloadChart()])
  }
)
export const invitationsTab = createLazyTab(
  async () => (await import('./invitations')).OrganizationInvitations,
  async () => (await import('./invitations-skeleton')).InvitationsSkeleton
)
export const joinRequestsTab = createLazyTab(
  async () => (await import('./join-requests')).OrganizationJoinRequests,
  async () => (await import('./join-requests-skeleton')).JoinRequestsSkeleton
)
export const membersTab = createLazyTab(
  async () => (await import('./members')).OrganizationMembers,
  async () => (await import('./members-skeleton')).MembersSkeleton
)
export const settingsTab = createLazyTab(
  async () => (await import('./settings')).OrganizationSettings,
  async () => (await import('./settings-skeleton')).SettingsSkeleton
)

const certificatesTab = {
  preload: async (scope: OrganizationScope) => {
    const { prefetchCertificates } = await import('./certificates-panel')
    await prefetchCertificates(scope)
  },
}

const TABS_BY_NAME: Partial<Record<OrganizationTab, { preload: (scope: OrganizationScope) => Promise<void> }>> = {
  activity: activityTab,
  certificates: certificatesTab,
  insights: insightsTab,
  invitations: invitationsTab,
  members: membersTab,
  requests: joinRequestsTab,
  settings: settingsTab,
}

export const preloadOrganizationTab = async (tab: string, scope: OrganizationScope) => {
  await TABS_BY_NAME[tab as OrganizationTab]?.preload(scope)
}

export const warmOrganizationData = async (scope: OrganizationScope) => {
  const [{ prefetchInsights }, { prefetchCertificates }] = await Promise.all([
    import('./insights'),
    import('./certificates-panel'),
  ])
  await Promise.all([prefetchInsights(scope), prefetchCertificates(scope)])
}

const PRELOAD_TIMEOUT_MS = 3000

export const preloadWithin = async (tab: string, scope: OrganizationScope) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<void>(resolve => {
    timer = setTimeout(resolve, PRELOAD_TIMEOUT_MS)
  })
  try {
    await Promise.race([preloadOrganizationTab(tab, scope), timeout])
  } finally {
    clearTimeout(timer)
  }
}
