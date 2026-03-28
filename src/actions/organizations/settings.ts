'use server'

import 'server-only'

import { and, count, eq } from 'drizzle-orm'

import { deleteCookie, setCookie } from '@/actions/cookies'
import {
  assertOrganizationAdmin,
  getDescriptionRecord,
  getFreshCurrentUser,
  getOrganizationContext,
} from '@/actions/organizations/helpers'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { certificates, organizationProfiles, organizations } from '@/db/schema'
import { r2Delete, r2Put } from '@/lib/storage'

export const updateOrganization = async ({
  address,
  city,
  country,
  description,
  email,
  name,
  phone,
  postcode,
  region,
  url,
}: {
  address: string
  city: string
  country: string
  description: string
  email: string
  name: string
  phone: string
  postcode: string
  region: string
  url: string
}) => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(role)

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

    await db
      .update(organizations)
      .set({
        city: city.trim(),
        email: email.trim().toLowerCase(),
        name: name.trim(),
      })
      .where(and(eq(organizations.id, organization.id), eq(organizations.updatedAt, current.updatedAt)))

    await db
      .insert(organizationProfiles)
      .values({
        organizationId: organization.id,
        address: address.trim() || null,
        country: country.trim() || null,
        description: getDescriptionRecord(
          description.trim(),
          user.locale ?? undefined,
          current.profile?.description ?? null
        ),
        phone: phone.trim() || null,
        postcode: postcode.trim() || null,
        region: region.trim() || null,
        url: url.trim() || null,
      })
      .onConflictDoUpdate({
        target: organizationProfiles.organizationId,
        set: {
          address: address.trim() || null,
          country: country.trim() || null,
          description: getDescriptionRecord(
            description.trim(),
            user.locale ?? undefined,
            current.profile?.description ?? null
          ),
          phone: phone.trim() || null,
          postcode: postcode.trim() || null,
          region: region.trim() || null,
          url: url.trim() || null,
        },
      })

    const nextUser = await getFreshCurrentUser(user.id)

    return {
      organizationId: organization.id,
      user: nextUser,
    }
  })
}

export const uploadOrganizationAvatar = async (formData: FormData) => {
  const file = formData.get('file') as File
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!file) {
      throw new Error('No file uploaded')
    }

    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(role)

    const current = await db.query.organizationProfiles.findFirst({
      columns: { avatarUrl: true },
      where: eq(organizationProfiles.organizationId, organization.id),
    })

    const url = await r2Put(`organizations/${organization.id}-${Date.now()}.png`, file, 'image/png')

    await db
      .insert(organizationProfiles)
      .values({ avatarUrl: url, organizationId: organization.id })
      .onConflictDoUpdate({
        target: organizationProfiles.organizationId,
        set: { avatarUrl: url },
      })

    if (current?.avatarUrl) {
      await r2Delete(current.avatarUrl).catch(() => null)
    }

    const nextUser = await getFreshCurrentUser(user.id)

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

    if (current?.avatarUrl) {
      await r2Delete(current.avatarUrl).catch(() => null)
    }

    await db
      .insert(organizationProfiles)
      .values({ avatarUrl: null, organizationId: organization.id })
      .onConflictDoUpdate({
        target: organizationProfiles.organizationId,
        set: { avatarUrl: null },
      })

    const nextUser = await getFreshCurrentUser(user.id)

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

    await db.delete(organizations).where(eq(organizations.id, organization.id))

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
