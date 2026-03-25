'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useCallback, useEffect, useState } from 'react'

import { type OrganizationPanelData } from '@/actions/organization'
import { type User } from '@/db/queries/user'
import { useSession } from '@/hooks/use-session'

import { OrganizationJoinRequests } from './join-requests'
import { OrganizationMembers } from './members'
import { OrganizationOverview } from './overview'
import { OrganizationSettings } from './settings'
import { useOrganizationTab } from './tabs'

export const OrganizationPanel = ({ initialData }: { initialData: OrganizationPanelData }) => {
  const router = useRouter()
  const { setOrganization, setUser } = useSession()
  const { tab } = useOrganizationTab()

  const [data, setData] = useState(initialData)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const currentTab = !data.isOrgAdmin && tab === 'settings' ? 'overview' : tab

  const refresh = useCallback(() => {
    startTransition(() => router.refresh())
  }, [router])

  const syncUser = useCallback(
    (nextUser: User) => {
      setUser(nextUser)
      const nextOrganization = nextUser.organizations[0]

      if (nextOrganization?.id) {
        setOrganization(nextOrganization.id)
      }
    },
    [setOrganization, setUser]
  )

  if (currentTab === 'members') {
    return (
      <OrganizationMembers
        currentUserId={data.currentUserId}
        isOrgAdmin={data.isOrgAdmin}
        members={data.members}
        onRefresh={refresh}
      />
    )
  }

  if (currentTab === 'joinRequests') {
    return <OrganizationJoinRequests joinRequests={data.joinRequests} onRefresh={refresh} />
  }

  if (currentTab === 'settings' && data.isOrgAdmin) {
    return <OrganizationSettings onRefresh={refresh} onSyncUser={syncUser} organization={data.organization} />
  }

  return <OrganizationOverview data={data} />
}
