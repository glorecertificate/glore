'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'

import { type getAdminOrganization } from '@/actions/admin/organizations'
import { OrganizationCertificatesSlot } from '@/components/features/organization/certificates-slot'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ApplicationSummary } from './application-summary'
import { OrganizationHeader } from './organization-header'

const OrganizationActivity = dynamic(
  async () => (await import('@/components/features/organization/activity')).OrganizationActivity
)
const OrganizationInvitations = dynamic(
  async () => (await import('@/components/features/organization/invitations')).OrganizationInvitations
)
const OrganizationMembers = dynamic(
  async () => (await import('@/components/features/organization/members')).OrganizationMembers
)
const OrganizationSettings = dynamic(
  async () => (await import('@/components/features/organization/settings')).OrganizationSettings
)

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

export const AdminOrganizationDetail = ({ initialData }: { initialData: AdminOrganizationData }) => {
  const { refresh: routerRefresh } = useRouter()
  const t = useTranslations('Organization')
  const tAdmin = useTranslations('Admin.organizations')
  const tInvitations = useTranslations('Invitations')
  const [selected, setTab] = useQueryState('tab', { ...tabParser, history: 'push', startTransition })

  const request = initialData.joinRequests.find(item => item.role === 'admin') ?? null
  const hasApplication = Boolean(request || initialData.motivation || initialData.charterAcceptedAt)
  const defaultTab: AdminOrganizationTab = hasApplication && !initialData.approvedAt ? 'application' : 'members'
  const tab = selected === 'application' && !hasApplication ? 'members' : (selected ?? defaultTab)
  const pendingInvitations = initialData.invitations.filter(({ state }) => state === 'pending').length

  const refresh = () => {
    startTransition(() => routerRefresh())
  }

  return (
    <div className="space-y-6 pb-12">
      <OrganizationHeader organization={initialData} />
      <Tabs onValueChange={value => setTab(value as AdminOrganizationTab)} value={tab}>
        <TabsList className="max-w-full overflow-x-auto">
          {hasApplication && <TabsTrigger value="application">{tAdmin('app_tab')}</TabsTrigger>}
          <TabsTrigger count={initialData.memberships.length} showZero value="members">
            {t('members')}
          </TabsTrigger>
          <TabsTrigger count={pendingInvitations} value="invitations">
            {tInvitations('tab')}
          </TabsTrigger>
          <TabsTrigger value="certificates">{t('certificates')}</TabsTrigger>
          <TabsTrigger value="activity">{t('activity')}</TabsTrigger>
          <TabsTrigger value="settings">{t('settings')}</TabsTrigger>
        </TabsList>
        {hasApplication && (
          <TabsContent className="pt-4" value="application">
            <ApplicationSummary organization={initialData} request={request} />
          </TabsContent>
        )}
        <TabsContent className="pt-4" value="members">
          <OrganizationMembers
            currentUserId={initialData.currentUserId}
            isOrgAdmin
            members={initialData.memberships}
            onRefresh={refresh}
            organizationId={initialData.id}
            organizationName={initialData.name}
          />
        </TabsContent>
        <TabsContent className="pt-4" value="invitations">
          <OrganizationInvitations
            currentUserId={initialData.currentUserId}
            invitations={initialData.invitations}
            isOrgAdmin
            onRefresh={refresh}
            organizationId={initialData.id}
          />
        </TabsContent>
        <TabsContent className="pt-4" value="certificates">
          <OrganizationCertificatesSlot pipeline={initialData.pipeline} />
        </TabsContent>
        <TabsContent className="pt-4" value="activity">
          <OrganizationActivity initial={initialData.activity} organizationId={initialData.id} />
        </TabsContent>
        <TabsContent className="pt-4" value="settings">
          <OrganizationSettings
            key={initialData.updatedAt}
            members={initialData.memberships}
            onRefresh={refresh}
            organization={{ ...initialData, role: null }}
            organizationId={initialData.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
