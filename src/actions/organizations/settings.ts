'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'

import { count, eq } from 'drizzle-orm'
import { z } from 'zod'

import { assertNotImpersonating } from '@/actions/admin/impersonation-state'
import { deleteOrganizationAsset } from '@/actions/certificates/snapshot-assets'
import { deleteCookie, setCookie } from '@/actions/cookies'
import {
  expireUserAccess,
  getFreshCurrentUser,
  getOrganizationAccess,
  listOrganizationMemberIds,
  revalidateOrganizationMembers,
} from '@/actions/organizations/helpers'
import { guarded } from '@/actions/organizations/invite-core'
import { db, transaction } from '@/db/client'
import { memberError, updateOrganization as updateOrganizationRecord } from '@/db/mutations/organization'
import { certificates, organizationProfiles, organizations } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import { SIGNATURE_CONTENT_TYPES } from '@/lib/constants'
import { LOCALES } from '@/lib/i18n'
import { r2PresignAvatar, r2PresignSignature, r2VerifyAvatar } from '@/lib/storage'
import { optionalHttpUrl } from '@/lib/url'

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
  description: z.partialRecord(z.enum(LOCALES), z.string().trim().max(5000)),
  email: z.email().max(254).toLowerCase(),
  legalName: optionalText(200),
  legalRepresentative: optionalText(150),
  name: z.string().trim().min(2).max(150),
  phone: optionalText(40),
  postcode: optionalText(20),
  region: optionalText(100),
  registryId: optionalText(100),
  url: optionalHttpUrl(500),
})

const requireOwner = async (organizationId?: number) => {
  const access = await getOrganizationAccess(organizationId)
  if (access.role !== 'admin') throw memberError('FORBIDDEN')
  return access
}

const currentProfile = async (organizationId: number) =>
  await db.query.organizationProfiles.findFirst({
    columns: { avatarUrl: true, signatureUrl: true },
    where: eq(organizationProfiles.organizationId, organizationId),
  })

const settle = async (access: Awaited<ReturnType<typeof requireOwner>>) => {
  expireUserAccess([access.user.id])
  const [, user] = await Promise.all([
    revalidateOrganizationMembers(access.organizationId),
    getFreshCurrentUser(access.user.id),
  ])
  return { organizationId: access.organizationId, user }
}

export const updateOrganization = async (input: z.input<typeof organizationSchema>, organizationId?: number) =>
  await guarded(async () => {
    const access = await requireOwner(organizationId)
    const parsed = organizationSchema.safeParse(input)
    if (!parsed.success) throw memberError('INVALID')
    const { description, ...values } = parsed.data

    const current = await db.query.organizations.findFirst({
      columns: { updatedAt: true },
      where: eq(organizations.id, access.organizationId),
    })
    if (!current) throw memberError('NOT_FOUND')

    await transaction(tx =>
      updateOrganizationRecord(tx, access.organizationId, {
        ...values,
        descriptionPatch: description,
        expectedUpdatedAt: current.updatedAt,
      })
    )
    return await settle(access)
  })

export const createOrganizationAvatarUploadUrl = async (contentType: string, size: number, organizationId?: number) =>
  await guarded(async () => {
    const access = await requireOwner(organizationId)
    return await r2PresignAvatar(`organizations/${access.organizationId}`, contentType, size)
  })

export const confirmOrganizationAvatar = async (key: string, organizationId?: number) =>
  await guarded(async () => {
    const access = await requireOwner(organizationId)
    if (!key.startsWith(`organizations/${access.organizationId}-`)) throw memberError('INVALID')

    const [avatarUrl, current] = await Promise.all([r2VerifyAvatar(key), currentProfile(access.organizationId)])
    await db
      .insert(organizationProfiles)
      .values({ avatarUrl, organizationId: access.organizationId })
      .onConflictDoUpdate({ target: organizationProfiles.organizationId, set: { avatarUrl } })
    if (current?.avatarUrl) await deleteOrganizationAsset(current.avatarUrl)
    return await settle(access)
  })

export const removeOrganizationAvatar = async (organizationId?: number) =>
  await guarded(async () => {
    const access = await requireOwner(organizationId)
    const current = await currentProfile(access.organizationId)
    await db
      .insert(organizationProfiles)
      .values({ avatarUrl: null, organizationId: access.organizationId })
      .onConflictDoUpdate({ target: organizationProfiles.organizationId, set: { avatarUrl: null } })
    if (current?.avatarUrl) await deleteOrganizationAsset(current.avatarUrl)
    return await settle(access)
  })

export const createOrganizationSignatureUploadUrl = async (
  contentType: string,
  size: number,
  organizationId?: number
) =>
  await guarded(async () => {
    const access = await requireOwner(organizationId)
    return await r2PresignSignature(`signatures/${access.organizationId}`, contentType, size)
  })

export const confirmOrganizationSignature = async (key: string, organizationId?: number) =>
  await guarded(async () => {
    const access = await requireOwner(organizationId)
    if (!key.startsWith(`signatures/${access.organizationId}-`)) throw memberError('INVALID')

    const [signatureUrl, current] = await Promise.all([
      r2VerifyAvatar(key, SIGNATURE_CONTENT_TYPES),
      currentProfile(access.organizationId),
    ])
    await db
      .insert(organizationProfiles)
      .values({ organizationId: access.organizationId, signatureUrl })
      .onConflictDoUpdate({ target: organizationProfiles.organizationId, set: { signatureUrl } })
    if (current?.signatureUrl) await deleteOrganizationAsset(current.signatureUrl)
    revalidateTag(CacheTag.Organizations, 'max')
    return { signatureUrl }
  })

export const removeOrganizationSignature = async (organizationId?: number) =>
  await guarded(async () => {
    const access = await requireOwner(organizationId)
    const current = await currentProfile(access.organizationId)
    await db
      .insert(organizationProfiles)
      .values({ organizationId: access.organizationId, signatureUrl: null })
      .onConflictDoUpdate({ target: organizationProfiles.organizationId, set: { signatureUrl: null } })
    if (current?.signatureUrl) await deleteOrganizationAsset(current.signatureUrl)
    revalidateTag(CacheTag.Organizations, 'max')
    return { signatureUrl: null }
  })

export const deleteOrganization = async (organizationId?: number) =>
  await guarded(async () => {
    await assertNotImpersonating()
    const access = await requireOwner(organizationId)
    const [certificateCount] = await db
      .select({ total: count() })
      .from(certificates)
      .where(eq(certificates.organizationId, access.organizationId))
    if ((certificateCount?.total ?? 0) > 0) throw memberError('HAS_CERTIFICATES')

    const [memberIds, profile] = await Promise.all([
      listOrganizationMemberIds(access.organizationId),
      currentProfile(access.organizationId),
    ])
    await db.delete(organizations).where(eq(organizations.id, access.organizationId))
    expireUserAccess(memberIds)
    revalidateTag(CacheTag.Organizations, 'max')
    if (profile?.avatarUrl) await deleteOrganizationAsset(profile.avatarUrl)
    if (profile?.signatureUrl) await deleteOrganizationAsset(profile.signatureUrl)

    const user = await getFreshCurrentUser(access.user.id)
    if (access.platform) return { organizationId: access.organizationId, user }

    const next = user.organizations[0]
    if (next) await setCookie('org', next.id, { httpOnly: false })
    else await deleteCookie('org')
    return { organizationId: access.organizationId, user }
  })
