'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { and, count, desc, eq, ne } from 'drizzle-orm'
import { z } from 'zod'

import { assertNotImpersonating } from '@/actions/admin/impersonation-state'
import { notify } from '@/actions/notifications/notify'
import {
  expireUserAccess,
  getFreshCurrentUser,
  getOrganizationAccess,
  memberUserColumns,
  reviewerColumns,
  settleEvents,
} from '@/actions/organizations/helpers'
import { guarded } from '@/actions/organizations/invite-core'
import { getCurrentUser } from '@/actions/user'
import { db, transaction } from '@/db/client'
import { changeMemberRole, memberError, removeMembership, transferOwnership } from '@/db/mutations/organization'
import { canManageMemberRole } from '@/db/queries/organization'
import { SKILL_LEVELS, type SkillLevel } from '@/db/queries/skill-level-description'
import { certificates, courses, memberships, organizations, userAssessments, userCourses } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import { deleteCookie, getCookie, setCookie } from '@/lib/cookie-store'
import { fullName } from '@/lib/utils'

const roleSchema = z.enum(['learner', 'representative', 'tutor', 'volunteer'])
const idSchema = z.number().int().positive()
const transferSchema = z.object({ confirmation: z.string().trim().min(1).max(200), newOwnerMembershipId: idSchema })

const findMembership = async (membershipId: number, organizationId: number) => {
  const membership = await db.query.memberships.findFirst({
    where: and(eq(memberships.id, membershipId), eq(memberships.organizationId, organizationId)),
  })
  if (!membership) throw memberError('NOT_FOUND')
  return membership
}

const parseId = (value: unknown) => {
  const parsed = idSchema.safeParse(value)
  if (!parsed.success) throw memberError('INVALID')
  return parsed.data
}

export const updateOrganizationMemberRole = async (membershipId: number, role: string, organizationId?: number) =>
  await guarded(async () => {
    const access = await getOrganizationAccess(organizationId)
    if (access.role !== 'admin') throw memberError('FORBIDDEN')
    const parsedRole = roleSchema.safeParse(role)
    if (!parsedRole.success) throw memberError('INVALID')

    const { events, userId } = await transaction(tx =>
      changeMemberRole(tx, {
        actorId: access.user.id,
        membershipId: parseId(membershipId),
        organizationId: access.organizationId,
        role: parsedRole.data,
      })
    )
    await settleEvents(events)
    expireUserAccess([userId])
    updateTag(CacheTag.Organizations)
    return { id: membershipId }
  })

export const removeOrganizationMember = async (membershipId: number, organizationId?: number) =>
  await guarded(async () => {
    const access = await getOrganizationAccess(organizationId)
    if (access.role !== 'admin' && access.role !== 'representative') throw memberError('FORBIDDEN')
    const membership = await findMembership(parseId(membershipId), access.organizationId)
    if (membership.userId === access.user.id) throw memberError('SELF')
    if (!canManageMemberRole(access.role, membership.role)) throw memberError('FORBIDDEN')

    const { events } = await transaction(tx =>
      removeMembership(tx, {
        actorId: access.user.id,
        membershipId: membership.id,
        organizationId: access.organizationId,
      })
    )
    await settleEvents(events)
    expireUserAccess([membership.userId])
    updateTag(CacheTag.Organizations)
    return { id: membership.id, userId: membership.userId }
  })

export const leaveOrganization = async (organizationId: number) =>
  await guarded(async () => {
    const user = await getCurrentUser()
    const id = parseId(organizationId)
    const membership = await db.query.memberships.findFirst({
      where: and(eq(memberships.userId, user.id), eq(memberships.organizationId, id)),
    })
    if (!membership) throw memberError('NOT_FOUND')

    const { events } = await transaction(tx =>
      removeMembership(tx, { actorId: user.id, kind: 'left', membershipId: membership.id, organizationId: id })
    )
    await settleEvents(events)
    expireUserAccess([user.id])
    updateTag(CacheTag.Organizations)

    const nextUser = await getFreshCurrentUser(user.id)
    const activeId = Number(await getCookie('org'))
    const next = nextUser.organizations[0]
    if (activeId === id || !nextUser.organizations.some(item => item.id === activeId)) {
      if (next) await setCookie('org', next.id, { httpOnly: false })
      if (!next) await deleteCookie('org')
    }
    return { user: nextUser }
  })

export const transferOrganizationOwnership = async (input: z.input<typeof transferSchema>) =>
  await guarded(async () => {
    await assertNotImpersonating()
    const access = await getOrganizationAccess()
    if (access.role !== 'admin' || access.platform) throw memberError('FORBIDDEN')
    const parsed = transferSchema.safeParse(input)
    if (!parsed.success) throw memberError('INVALID')

    const organization = await db.query.organizations.findFirst({
      columns: { name: true },
      where: eq(organizations.id, access.organizationId),
    })
    if (!organization) throw memberError('NOT_FOUND')
    if (parsed.data.confirmation.toLowerCase() !== organization.name.trim().toLowerCase()) {
      throw memberError('CONFIRMATION')
    }

    const { event } = await transaction(tx =>
      transferOwnership(tx, {
        actorId: access.user.id,
        newOwnerMembershipId: parsed.data.newOwnerMembershipId,
        organizationId: access.organizationId,
      })
    )
    await notify(event)
    expireUserAccess([event.data.newOwnerId, event.data.previousOwnerId])
    updateTag(CacheTag.Organizations)
    return { user: await getFreshCurrentUser(access.user.id) }
  })

export const getOrganizationMemberDetail = async (membershipId: number, organizationId?: number) =>
  await guarded(async () => {
    const access = await getOrganizationAccess(organizationId)
    if (access.role !== 'admin' && access.role !== 'representative') throw memberError('FORBIDDEN')
    const membership = await db.query.memberships.findFirst({
      where: and(eq(memberships.id, parseId(membershipId)), eq(memberships.organizationId, access.organizationId)),
      with: { user: { columns: memberUserColumns } },
    })
    if (!membership) throw memberError('NOT_FOUND')
    const { user } = membership

    const [progress, levels, issued] = await Promise.all([
      db
        .select({
          completedAt: userCourses.completedAt,
          id: courses.id,
          slug: courses.slug,
          startedAt: userCourses.createdAt,
          title: courses.title,
          type: courses.type,
        })
        .from(userCourses)
        .innerJoin(courses, eq(courses.id, userCourses.courseId))
        .where(eq(userCourses.userId, user.id))
        .orderBy(desc(userCourses.updatedAt))
        .limit(50),
      db
        .select({ count: count(), level: userAssessments.value })
        .from(userAssessments)
        .where(eq(userAssessments.userId, user.id))
        .groupBy(userAssessments.value),
      db.query.certificates.findMany({
        columns: { code: true, id: true, isDefault: true, issuedAt: true, status: true, submittedAt: true },
        limit: 20,
        orderBy: desc(certificates.createdAt),
        where: and(
          eq(certificates.userId, user.id),
          eq(certificates.organizationId, access.organizationId),
          ne(certificates.status, 'draft')
        ),
        with: { reviewer: { columns: reviewerColumns }, skills: { columns: { id: true } } },
      }),
    ])

    return {
      certificates: issued.map(({ reviewer, skills, ...certificate }) => ({
        ...certificate,
        reviewerName: reviewer ? fullName(reviewer) || reviewer.email : null,
        skillCount: skills.length,
      })),
      courses: progress,
      id: membership.id,
      joinedAt: membership.createdAt,
      profile: {
        avatarUrl: user.avatarUrl,
        email: user.email,
        id: user.id,
        isPending: !user.onboardedAt,
        name: fullName(user) || user.email,
        username: user.username,
      },
      role: membership.role,
      summary: {
        completed: progress.filter(({ completedAt }) => completedAt).length,
        skillCompleted: progress.filter(({ completedAt, type }) => completedAt && type === 'skill').length,
        levelCounts: Object.fromEntries(
          SKILL_LEVELS.map(level => [level, levels.find(row => row.level === level)?.count ?? 0])
        ) as Record<SkillLevel, number>,
        started: progress.length,
      },
    }
  })

export type MemberDetail = NonNullable<Awaited<ReturnType<typeof getOrganizationMemberDetail>>['data']>
