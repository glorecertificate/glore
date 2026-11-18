'use server'

import 'server-only'

import { and, eq } from 'drizzle-orm'

import { getOrganizationContext } from '@/actions/organizations/helpers'
import { queryOrganizationPanel } from '@/actions/organizations/panel-data'
import { getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { memberships } from '@/db/schema'

export type { OrganizationPanelData } from '@/actions/organizations/helpers'

export const getOrganizationPanel = async () => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }
    return await queryOrganizationPanel(organization.id, role, user.id)
  })
}

export const listOrgTutors = async (organizationId: number) => {
  const user = await getCurrentUser()
  const isManager =
    user.isAdmin ||
    user.organizations.some(({ id, role }) => id === organizationId && (role === 'admin' || role === 'representative'))
  if (!isManager) return { data: null, error: null }
  return await safeQuery(async () => {
    const result = await db.query.memberships.findMany({
      where: and(eq(memberships.organizationId, organizationId), eq(memberships.role, 'tutor')),
      columns: {},
      with: {
        user: { columns: { id: true, firstName: true, lastName: true } },
      },
      limit: 200,
    })
    return result.map(m => m.user)
  })
}
