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
import { certificates, organizations } from '@/db/schema'
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
      where: eq(organizations.id, organization.id),
    })

    if (!current) {
      throw new Error('Organization not found')
    }

    await db
      .update(organizations)
      .set({
        address: address.trim() || null,
        city: city.trim(),
        country: country.trim() || null,
        description: getDescriptionRecord(description.trim(), user.locale ?? undefined, current.description ?? null),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        phone: phone.trim() || null,
        postcode: postcode.trim() || null,
        region: region.trim() || null,
        url: url.trim() || null,
      })
      .where(and(eq(organizations.id, organization.id), eq(organizations.updatedAt, current.updatedAt)))

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

    const current = await db.query.organizations.findFirst({
      columns: { avatarUrl: true },
      where: eq(organizations.id, organization.id),
    })

    const url = await r2Put(`organizations/${organization.id}-${Date.now()}.png`, file, 'image/png')

    await db.update(organizations).set({ avatarUrl: url }).where(eq(organizations.id, organization.id))

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

    const current = await db.query.organizations.findFirst({
      columns: { avatarUrl: true },
      where: eq(organizations.id, organization.id),
    })

    if (current?.avatarUrl) {
      await r2Delete(current.avatarUrl).catch(() => null)
    }

    await db.update(organizations).set({ avatarUrl: null }).where(eq(organizations.id, organization.id))

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
