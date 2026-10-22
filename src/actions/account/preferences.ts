'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { getAuthUser } from '@/actions/auth'
import { expireCertificateCaches } from '@/actions/certificates/helpers'
import { db, transaction } from '@/db/client'
import { queryError } from '@/db/helpers'
import { recordFeaturedCertificate } from '@/db/mutations/certificate'
import { mergeNotificationPreferences } from '@/db/mutations/user'
import { certificates, users } from '@/db/schema'
import { userTag } from '@/lib/cache'

const preferencesSchema = z.strictObject({
  learning: z.boolean().optional(),
  organization: z.boolean().optional(),
  reminders: z.boolean().optional(),
})

const privacySchema = z.strictObject({
  featuredCertificateId: z.number().int().positive().optional(),
  publicProfile: z.boolean().optional(),
})

const unauthenticated = () => ({ code: 'UNAUTHORIZED', message: 'Not authenticated' })

export const updateNotificationPreferences = async (values: z.input<typeof preferencesSchema>) => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }

  const parsed = preferencesSchema.safeParse(values)
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return { data: null, error: { code: 'INVALID_INPUT', message: 'Invalid preferences' } }
  }

  try {
    await mergeNotificationPreferences(user.id, parsed.data)
    updateTag(userTag(user.id))
    return { data: parsed.data, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}

export const updatePrivacy = async (values: z.input<typeof privacySchema>) => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }

  const parsed = privacySchema.safeParse(values)
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return { data: null, error: { code: 'INVALID_INPUT', message: 'Invalid privacy settings' } }
  }
  const { featuredCertificateId, publicProfile } = parsed.data

  try {
    const featured = await transaction(async tx => {
      if (publicProfile !== undefined) await tx.update(users).set({ publicProfile }).where(eq(users.id, user.id))
      if (featuredCertificateId === undefined) return null
      return await recordFeaturedCertificate(tx, { id: featuredCertificateId, userId: user.id })
    })
    updateTag(userTag(user.id))
    if (featured) expireCertificateCaches({ organizationId: featured.organizationId, userId: user.id })
    return { data: parsed.data, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}

export const listFeaturableCertificates = async () => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }

  try {
    const rows = await db.query.certificates.findMany({
      columns: { code: true, id: true, isDefault: true, issuedAt: true },
      orderBy: desc(certificates.issuedAt),
      where: and(eq(certificates.userId, user.id), eq(certificates.status, 'approved')),
      with: { organization: { columns: { name: true } } },
    })
    return {
      data: rows.map(({ organization, ...row }) => ({ ...row, organizationName: organization.name })),
      error: null,
    }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}
