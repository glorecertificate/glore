'use server'

import 'server-only'

import { count, eq } from 'drizzle-orm'
import { z } from 'zod'

import { deleteCookie, setCookie } from '@/actions/cookies'
import {
  assertOrganizationAdmin,
  expireUserAccess,
  getDescriptionRecord,
  getFreshCurrentUser,
  getOrganizationContext,
  listOrganizationMemberIds,
  revalidateOrganizationMembers,
} from '@/actions/organizations/helpers'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { updateOrganization as updateOrganizationRecord } from '@/db/mutations/organization'
import { certificates, organizationProfiles, organizations } from '@/db/schema'
import { r2DeleteQuietly, r2PresignAvatar, r2VerifyAvatar } from '@/lib/storage'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform(value => value || null)

const organizationSchema = z.object({
  address: optionalText(300),
  city: z.string().trim().min(1).max(100),
  country: optionalText(2),
  description: z.string().trim().max(5000),
  email: z.email().max(254).toLowerCase(),
  name: z.string().trim().min(2).max(150),
  phone: optionalText(40),
  postcode: optionalText(20),
  region: optionalText(100),
  url: optionalText(500),
})

export const updateOrganization = async (input: z.input<typeof organizationSchema>) => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(role)

    const { description, ...values } = organizationSchema.parse(input)

    const current = await db.query.organizations.findFirst({
      with: {
        profile: {
          columns: {
            description: true,
          },
        },
      },
      where: eq(organizations.id, organization.id),
    })

    if (!current) {
      throw new Error('Organization not found')
    }

    await transaction(tx =>
      updateOrganizationRecord(tx, organization.id, {
        ...values,
        description: getDescriptionRecord(description, user.locale ?? undefined, current.profile?.description ?? null),
        expectedUpdatedAt: current.updatedAt,
      })
    )

    const nextUser = await getFreshCurrentUser(user.id)

    return {
      organizationId: organization.id,
      user: nextUser,
    }
  })
}

export const createOrganizationAvatarUploadUrl = async (contentType: string, size: number) => {
  const { organization, role } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(role)

    return await r2PresignAvatar(`organizations/${organization.id}`, contentType, size)
  })
}

export const confirmOrganizationAvatar = async (key: string) => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(role)

    if (!key.startsWith(`organizations/${organization.id}-`)) {
      throw new Error('Invalid key')
    }

    const avatarUrl = await r2VerifyAvatar(key)
    const current = await db.query.organizationProfiles.findFirst({
      columns: { avatarUrl: true },
      where: eq(organizationProfiles.organizationId, organization.id),
    })

    await db.insert(organizationProfiles).values({ avatarUrl, organizationId: organization.id }).onConflictDoUpdate({
      target: organizationProfiles.organizationId,
      set: { avatarUrl },
    })

    if (current?.avatarUrl) {
      await r2DeleteQuietly(current.avatarUrl)
    }

    const [, nextUser] = await Promise.all([
      revalidateOrganizationMembers(organization.id),
      getFreshCurrentUser(user.id),
    ])

    return {
      organizationId: organization.id,
      user: nextUser,
    }
  })
}

export const removeOrganizationAvatar = async () => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(role)

    const current = await db.query.organizationProfiles.findFirst({
      columns: { avatarUrl: true },
      where: eq(organizationProfiles.organizationId, organization.id),
    })

    await db
      .insert(organizationProfiles)
      .values({ avatarUrl: null, organizationId: organization.id })
      .onConflictDoUpdate({
        target: organizationProfiles.organizationId,
        set: { avatarUrl: null },
      })

    if (current?.avatarUrl) {
      await r2DeleteQuietly(current.avatarUrl)
    }

    const [, nextUser] = await Promise.all([
      revalidateOrganizationMembers(organization.id),
      getFreshCurrentUser(user.id),
    ])

    return {
      organizationId: organization.id,
      user: nextUser,
    }
  })
}

export const deleteOrganization = async () => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    assertOrganizationAdmin(role)

    const [certificateCount] = await db
      .select({ total: count() })
      .from(certificates)
      .where(eq(certificates.organizationId, organization.id))

    if ((certificateCount?.total ?? 0) > 0) {
      throw new Error('Organizations with certificates cannot be deleted')
    }

    const [memberIds, profile] = await Promise.all([
      listOrganizationMemberIds(organization.id),
      db.query.organizationProfiles.findFirst({
        columns: { avatarUrl: true },
        where: eq(organizationProfiles.organizationId, organization.id),
      }),
    ])
    await db.delete(organizations).where(eq(organizations.id, organization.id))
    expireUserAccess(memberIds)
    if (profile?.avatarUrl) await r2DeleteQuietly(profile.avatarUrl)

    const nextUser = await getFreshCurrentUser(user.id)
    const nextOrganization = nextUser.organizations[0]

    if (nextOrganization?.id) {
      await setCookie('org', nextOrganization.id)
    } else {
      await deleteCookie('org')
    }

    return {
      organizationId: organization.id,
      user: nextUser,
    }
  })
}
