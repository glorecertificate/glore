import 'server-only'

import { and, isNotNull, isNull, lt, or } from 'drizzle-orm'

import { selectOrphanPdfKeys } from '@/actions/maintenance/plan'
import { db } from '@/db/client'
import {
  certificates,
  organizationInvitations,
  organizationProfiles,
  sessions,
  users,
  verifications,
} from '@/db/schema'
import { pruneRateLimits } from '@/lib/rate-limit'
import { r2Delete, r2List, selectOrphanKeys } from '@/lib/storage'
import config from '~/config/app.json'

const DAY = 24 * 60 * 60 * 1000

const AVATAR_PREFIXES = ['avatars/', 'organizations/']

export const pruneExpiredRecords = async (now = new Date()) => {
  const iso = now.toISOString()
  const retained = new Date(now.getTime() - config.invitationRetentionDays * DAY).toISOString()

  const [invitations, expiredSessions, expiredVerifications] = await Promise.all([
    db
      .delete(organizationInvitations)
      .where(
        or(
          and(isNull(organizationInvitations.acceptedAt), lt(organizationInvitations.expiresAt, retained)),
          lt(organizationInvitations.revokedAt, retained),
          lt(organizationInvitations.declinedAt, retained)
        )
      )
      .returning({ id: organizationInvitations.id }),
    db.delete(sessions).where(lt(sessions.expiresAt, iso)).returning({ id: sessions.id }),
    db.delete(verifications).where(lt(verifications.expiresAt, iso)).returning({ id: verifications.id }),
  ])

  return {
    invitations: invitations.length,
    sessions: expiredSessions.length,
    verifications: expiredVerifications.length,
  }
}

export const sweepOrphanAvatars = async (now = new Date()) => {
  const [userAvatars, organizationAvatars, ...listings] = await Promise.all([
    db.select({ url: users.avatarUrl }).from(users).where(isNotNull(users.avatarUrl)),
    db
      .select({ url: organizationProfiles.avatarUrl })
      .from(organizationProfiles)
      .where(isNotNull(organizationProfiles.avatarUrl)),
    ...AVATAR_PREFIXES.map(r2List),
  ])

  const referenced = [...userAvatars, ...organizationAvatars].flatMap(({ url }) => (url ? [url] : []))
  const orphans = selectOrphanKeys(listings.flat(), referenced, new Date(now.getTime() - DAY))
  await Promise.all(orphans.map(r2Delete))
  return orphans.length
}

export const sweepOrphanCertificatePdfs = async (now = new Date()) => {
  const [rows, objects] = await Promise.all([
    db.select({ documentUrl: certificates.documentUrl, handle: certificates.handle }).from(certificates),
    r2List('certificates/'),
  ])
  const orphans = selectOrphanPdfKeys(objects, rows, new Date(now.getTime() - DAY))
  await Promise.all(orphans.map(r2Delete))
  return orphans.length
}

export const pruneRateLimitRows = async () => await pruneRateLimits(DAY)
