'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'

import { type getAdminOrganization } from '@/actions/admin/organizations'
import { OrganizationCertificatesPanel } from '@/components/features/organization/certificates-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ApplicationSummary } from './application-summary'
import { type AdminOrganizationStatus } from './organization-band'
import { AdminOrganizationRail } from './organization-rail'
import { organizationState } from './utils'

const loadActivity = async () => (await import('@/components/features/organization/activity')).OrganizationActivity
const loadInvitations = async () =>
  (await import('@/components/features/organization/invitations')).OrganizationInvitations
const loadMembers = async () => (await import('@/components/features/organization/members')).OrganizationMembers
const loadSettings = async () => (await import('@/components/features/organization/settings')).OrganizationSettings

const OrganizationActivity = dynamic(loadActivity)
const OrganizationInvitations = dynamic(loadInvitations)
const OrganizationMembers = dynamic(loadMembers)
const OrganizationSettings = dynamic(loadSettings)

export const preloadAdminOrganizationDetail = () => {
  void Promise.all([loadActivity(), loadInvitations(), loadMembers(), loadSettings()])
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
    <Tabs className="gap-0" onValueChange={value => setTab(value as AdminOrganizationTab)} value={tab} {...props} />
  )
}

export const AdminOrganizationTabsList = ({
  hasApplication,
  members,
  pendingInvitations,
}: {
  hasApplication: boolean
  members: number
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
      <TabsTrigger value="certificates">{t('certificates')}</TabsTrigger>
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
  const { hasApplication } = organizationState(initialData)
  const request = initialData.joinRequests.find(item => item.role === 'admin') ?? null

  const refresh = () => {
    startTransition(() => routerRefresh())
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        {hasApplication && (
          <TabsContent value="application">
            <ApplicationSummary organization={initialData} request={request} />
          </TabsContent>
        )}
        <TabsContent value="members">
          <OrganizationMembers
            currentUserId={initialData.currentUserId}
            isOrgAdmin
            members={initialData.memberships}
            onRefresh={refresh}
            organizationId={initialData.id}
            organizationName={initialData.name}
          />
        </TabsContent>
        <TabsContent value="invitations">
          <OrganizationInvitations
            currentUserId={initialData.currentUserId}
            invitations={initialData.invitations}
            isOrgAdmin
            onRefresh={refresh}
            organizationId={initialData.id}
          />
        </TabsContent>
        <TabsContent value="certificates">
          <OrganizationCertificatesPanel organizationId={initialData.id} />
        </TabsContent>
        <TabsContent value="activity">
          <OrganizationActivity initial={initialData.activity} organizationId={initialData.id} />
        </TabsContent>
        <TabsContent value="settings">
          <OrganizationSettings
            key={initialData.updatedAt}
            members={initialData.memberships}
            onRefresh={refresh}
            organization={{ ...initialData, role: null }}
            organizationId={initialData.id}
          />
        </TabsContent>
      </div>
      <AdminOrganizationRail data={initialData} status={status} />
    </div>
  )
}
