'use client'

import { useRouter } from 'next/navigation'
import { Activity, createContext, startTransition, use, useEffect } from 'react'

import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'

import { type getAdminOrganization } from '@/actions/admin/organizations'
import {
  OrganizationCertificatesPanel,
  prefetchCertificates,
} from '@/components/features/organization/certificates-panel'
import { activityTab, invitationsTab, membersTab, settingsTab } from '@/components/features/organization/lazy-tabs'
import { TabSlot } from '@/components/features/organization/tab-slot'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { whenIdle } from '@/lib/prefetch'

import { ApplicationSummary } from './application-summary'
import { type AdminOrganizationStatus } from './organization-band'
import { AdminOrganizationRail } from './organization-rail'
import { AdminOrganizationRejection } from './organization-rejection'
import { organizationState } from './utils'

const ADMIN_PRELOAD_SCOPE = { organizationId: 0, userId: '' }

export const preloadAdminOrganizationDetail = async () => {
  await Promise.all(
    [activityTab, invitationsTab, membersTab, settingsTab].map(lazy => lazy.preload(ADMIN_PRELOAD_SCOPE))
  )
}

type AdminOrganizationData = NonNullable<Awaited<ReturnType<typeof getAdminOrganization>>['data']>

const ADMIN_ORGANIZATION_TABS = [
  'application',
  'members',
  'invitations',
  'certificates',
  'activity',
  'settings',
] as const

type AdminOrganizationTab = (typeof ADMIN_ORGANIZATION_TABS)[number]

const AdminOrganizationTabContext = createContext<AdminOrganizationTab>('members')

const tabParser = parseAsStringEnum([...ADMIN_ORGANIZATION_TABS])

const useAdminOrganizationTab = ({ approved, hasApplication }: { approved: boolean; hasApplication: boolean }) => {
  const [selected, setTab] = useQueryState('tab', { ...tabParser, history: 'push', startTransition })
  const defaultTab: AdminOrganizationTab = hasApplication && !approved ? 'application' : 'members'
  const tab = selected === 'application' && !hasApplication ? 'members' : (selected ?? defaultTab)

  return { setTab, tab }
}

export const AdminOrganizationTabs = ({
  approved,
  hasApplication,
  ...props
}: React.ComponentProps<typeof Tabs> & { approved: boolean; hasApplication: boolean }) => {
  const { setTab, tab } = useAdminOrganizationTab({ approved, hasApplication })

  return (
    <AdminOrganizationTabContext value={tab}>
      <Tabs className="gap-0" onValueChange={value => setTab(value as AdminOrganizationTab)} value={tab} {...props} />
    </AdminOrganizationTabContext>
  )
}

const AdminOrganizationPanel = ({ children, value }: { children: React.ReactNode; value: AdminOrganizationTab }) => {
  const tab = use(AdminOrganizationTabContext)

  return (
    <TabsContent forceMount value={value}>
      <Activity mode={tab === value ? 'visible' : 'hidden'}>{children}</Activity>
    </TabsContent>
  )
}

const AdminOrganizationWarmup = ({ organizationId }: { organizationId: number }) => {
  useEffect(() => {
    const warm = () => {
      void preloadAdminOrganizationDetail()
      void prefetchCertificates({ organizationId, userId: '' })
    }
    return whenIdle(warm)
  }, [organizationId])

  return null
}

export const AdminOrganizationTabsList = ({
  hasApplication,
  members,
  organizationId,
  pendingInvitations,
}: {
  hasApplication: boolean
  members: number
  organizationId: number
  pendingInvitations: number
}) => {
  const t = useTranslations('Organization')
  const tAdmin = useTranslations('Admin.organizations')
  const tInvitations = useTranslations('Invitations')

  return (
    <TabsList className="max-w-full min-w-0 justify-start overflow-x-auto">
      {hasApplication && <TabsTrigger value="application">{tAdmin('app_tab')}</TabsTrigger>}
      <TabsTrigger count={members} showZero value="members">
        {t('members')}
      </TabsTrigger>
      <TabsTrigger count={pendingInvitations} value="invitations">
        {tInvitations('tab')}
      </TabsTrigger>
      <TabsTrigger
        onFocus={() => void prefetchCertificates({ organizationId, userId: '' })}
        onPointerEnter={() => void prefetchCertificates({ organizationId, userId: '' })}
        value="certificates"
      >
        {t('certificates')}
      </TabsTrigger>
      <TabsTrigger value="activity">{t('activity')}</TabsTrigger>
      <TabsTrigger value="settings">{t('settings')}</TabsTrigger>
    </TabsList>
  )
}

export const AdminOrganizationDetail = ({
  initialData,
  status,
}: {
  initialData: AdminOrganizationData
  status: AdminOrganizationStatus
}) => {
  const { refresh: routerRefresh } = useRouter()
  const tAdmin = useTranslations('Admin.organizations')
  const { hasApplication } = organizationState(initialData)
  const request = initialData.joinRequests.find(item => item.role === 'admin') ?? null

  const refresh = () => {
    startTransition(() => routerRefresh())
  }

  return (
    <div className="@container/detail">
      <AdminOrganizationWarmup organizationId={initialData.id} />
      {status === 'rejected' && <AdminOrganizationRejection request={request} />}
      <div className="grid items-start gap-6 @5xl/detail:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {hasApplication && (
            <AdminOrganizationPanel value="application">
              <ApplicationSummary organization={initialData} request={request} />
            </AdminOrganizationPanel>
          )}
          <AdminOrganizationPanel value="members">
            <TabSlot
              lazy={membersTab}
              currentUserId={initialData.currentUserId}
              isOrgAdmin
              emptyDescription={status === 'rejected' ? tAdmin('rejectedMembersEmpty') : undefined}
              members={initialData.memberships}
              onRefresh={refresh}
              organizationId={initialData.id}
              organizationName={initialData.name}
            />
          </AdminOrganizationPanel>
          <AdminOrganizationPanel value="invitations">
            <TabSlot
              lazy={invitationsTab}
              currentUserId={initialData.currentUserId}
              invitations={initialData.invitations}
              isOrgAdmin
              onRefresh={refresh}
              organizationId={initialData.id}
            />
          </AdminOrganizationPanel>
          <AdminOrganizationPanel value="certificates">
            <OrganizationCertificatesPanel organizationId={initialData.id} />
          </AdminOrganizationPanel>
          <AdminOrganizationPanel value="activity">
            <TabSlot lazy={activityTab} initial={initialData.activity} organizationId={initialData.id} />
          </AdminOrganizationPanel>
          <AdminOrganizationPanel value="settings">
            <TabSlot
              lazy={settingsTab}
              key={initialData.updatedAt}
              hasCertificates={Object.values(initialData.pipeline).some(count => count > 0)}
              members={initialData.memberships}
              onRefresh={refresh}
              organization={{ ...initialData, role: null }}
              organizationId={initialData.id}
            />
          </AdminOrganizationPanel>
        </div>
        <AdminOrganizationRail data={initialData} status={status} />
      </div>
    </div>
  )
}
