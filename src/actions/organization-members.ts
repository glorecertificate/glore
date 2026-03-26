'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { and, eq } from 'drizzle-orm'

import { createNotification } from '@/actions/notification'
import {
  assertOrganizationAdmin,
  assertOrganizationManager,
  canInviteRole,
  canManageMemberRole,
  getOrganizationAdminsCount,
  getOrganizationContext,
  memberUserColumns,
  sendOrganizationAccessEmail,
} from '@/actions/organization-helpers'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type OrganizationMembershipRole, parseOrganizationMember } from '@/db/queries/organization'
import { memberships, users } from '@/db/schema'
import { auth } from '@/lib/auth'

export const inviteOrganizationMember = async ({
  email,
  firstName,
  lastName,
  locale,
  role,
}: {
  email: string
  firstName: string
  lastName: string
  locale: string
  role: OrganizationMembershipRole
}) => {
  const { organization, role: managerRole, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationManager(managerRole)

    if (!canInviteRole(managerRole, role)) {
      throw new Error('You cannot invite users with this role')
    }

    if (role === 'admin') {
      const adminCount = await getOrganizationAdminsCount(organization.id)
      if (adminCount > 0) {
        throw new Error('An organization admin already exists. Invite as representative instead.')
      }
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedFirstName = firstName.trim()
    const normalizedLastName = lastName.trim()

    const existingUser = await db.query.users.findFirst({
      columns: { email: true, firstName: true, id: true, lastName: true, onboardedAt: true },
      where: eq(users.email, normalizedEmail),
    })

    const invitee =
      existingUser ??
      (
        await auth.api.signUpEmail({
          body: {
            email: normalizedEmail,
            firstName: normalizedFirstName,
            lastName: normalizedLastName || undefined,
            locale,
            name: [normalizedFirstName, normalizedLastName].filter(Boolean).join(' '),
            password: randomBytes(32).toString('hex'),
          },
        })
      )?.user

    if (!invitee?.id) {
      throw new Error('Failed to create member account')
    }

    const existingMembership = await db.query.memberships.findFirst({
      where: and(eq(memberships.organizationId, organization.id), eq(memberships.userId, invitee.id)),
    })

    if (existingMembership) {
      throw new Error('This user is already a member of the organization')
    }

    await db.insert(memberships).values({
      organizationId: organization.id,
      role,
      userId: invitee.id,
    })

    const inviterName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

    const emailSent = await sendOrganizationAccessEmail({
      email: normalizedEmail,
      inviterName,
      isNewUser: !existingUser || !existingUser.onboardedAt,
      organizationName: organization.name,
      role,
    })

    await createNotification(invitee.id, 'member_added', {
      organizationName: organization.name,
      role,
    }).catch(() => null)

    if (!existingUser || !existingUser.onboardedAt) {
      await auth.api
        .requestPasswordReset({
          body: {
            email: normalizedEmail,
            redirectTo: `${process.env.APP_URL}/login`,
          },
        })
        .catch(() => null)
    }

    return { email: normalizedEmail, emailSent, userId: invitee.id }
  })
}

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

    await db.delete(memberships).where(eq(memberships.id, membership.id))

    return { id: membership.id, userId: membership.userId }
  })
}
