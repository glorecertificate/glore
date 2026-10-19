import 'server-only'

import { and, eq } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { organizationProfiles, organizations } from '@/db/schema'
import { type IntlRecord } from '@/lib/i18n'

export const createOrganization = async (
  tx: Transaction,
  {
    approvedAt,
    city,
    country,
    email,
    handle,
    name,
    url,
  }: {
    approvedAt?: string | null
    city: string
    country?: string | null
    email: string
    handle: string
    name: string
    url?: string | null
  }
) => {
  const [org] = await tx
    .insert(organizations)
    .values({ approvedAt: approvedAt ?? null, city, email, handle, name })
    .returning({ id: organizations.id, name: organizations.name })

  if (!org) {
    throw new Error('Failed to create organization')
  }

  await tx.insert(organizationProfiles).values({
    country: country ?? null,
    organizationId: org.id,
    url: url ?? null,
  })

  return org
}

export const updateOrganization = async (
  tx: Transaction,
  organizationId: number,
  {
    address,
    city,
    country,
    description,
    email,
    expectedUpdatedAt,
    name,
    phone,
    postcode,
    region,
    url,
  }: {
    address: string | null
    city: string
    country: string | null
    description: IntlRecord | null
    email: string
    name: string
    phone: string | null
    postcode: string | null
    region: string | null
    url: string | null
    expectedUpdatedAt?: string
  }
) => {
  const [updated] = await tx
    .update(organizations)
    .set({ city, email, name })
    .where(
      expectedUpdatedAt
        ? and(eq(organizations.id, organizationId), eq(organizations.updatedAt, expectedUpdatedAt))
        : eq(organizations.id, organizationId)
    )
    .returning({ id: organizations.id })
  if (!updated) throw new Error('Conflict: organization was modified by another request')

  await tx
    .insert(organizationProfiles)
    .values({ address, country, description, organizationId, phone, postcode, region, url })
    .onConflictDoUpdate({
      target: organizationProfiles.organizationId,
      set: { address, country, description, phone, postcode, region, url },
    })
}
