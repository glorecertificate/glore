'use server'

import 'server-only'

import { and, eq } from 'drizzle-orm'

import { notify } from '@/actions/notifications/notify'
import {
  assertOrganizationAdmin,
  assertOrganizationManager,
  canManageMemberRole,
  expireUserAccess,
  getOrganizationAdminsCount,
  getOrganizationContext,
  memberUserColumns,
} from '@/actions/organizations/helpers'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { removeMembership } from '@/db/mutations/organization'
import { type OrganizationMembershipRole, parseOrganizationMember } from '@/db/queries/organization'
import { memberships } from '@/db/schema'

export const updateOrganizationMemberRole = async (membershipId: number, role: OrganizationMembershipRole) => {
  const { organization, role: managerRole, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(managerRole)

    const membership = await db.query.memberships.findFirst({
      where: and(eq(memberships.id, membershipId), eq(memberships.organizationId, organization.id)),
      with: {
        user: { columns: memberUserColumns },
      },
    })

    if (!membership) {
      throw new Error('Member not found')
    }

    if (membership.userId === user.id) {
      throw new Error('You cannot change your own role')
    }

    if (membership.role === 'admin' && role !== 'admin') {
      const adminCount = await getOrganizationAdminsCount(organization.id)

      if (adminCount <= 1) {
        throw new Error('At least one organization admin is required')
      }
    }

    if (role === 'admin' && membership.role !== 'admin') {
      const adminCount = await getOrganizationAdminsCount(organization.id)

      if (adminCount > 0) {
        throw new Error('An organization admin already exists. Only one admin is allowed per organization.')
      }
    }

    await db.update(memberships).set({ role }).where(eq(memberships.id, membership.id))
    expireUserAccess([membership.userId])

    return parseOrganizationMember({ ...membership, role })
  })
}

export const removeOrganizationMember = async (membershipId: number) => {
  const { organization, role: managerRole, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationManager(managerRole)

    const membership = await db.query.memberships.findFirst({
      where: and(eq(memberships.id, membershipId), eq(memberships.organizationId, organization.id)),
      with: {
        user: { columns: memberUserColumns },
      },
    })

    if (!membership) {
      throw new Error('Member not found')
    }

    if (membership.userId === user.id) {
      throw new Error('You cannot remove yourself from the organization')
    }

    if (!canManageMemberRole(managerRole, membership.role)) {
      throw new Error('You cannot remove this member')
    }

    if (membership.role === 'admin') {
      const adminCount = await getOrganizationAdminsCount(organization.id)

      if (adminCount <= 1) {
        throw new Error('At least one organization admin is required')
      }
    }

    const { events } = await transaction(tx =>
      removeMembership(tx, { actorId: user.id, membershipId: membership.id, organizationId: organization.id })
    )
    await Promise.all(events.map(event => notify(event)))
    expireUserAccess([membership.userId])

    return { id: membership.id, userId: membership.userId }
  })
}
