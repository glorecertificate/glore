import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { and, asc, eq, inArray, ne } from 'drizzle-orm'

import { certificateWithUsers } from '@/actions/certificates/helpers'
import {
  type CertificateActivityEvent,
  type CertificateReviewNotes,
  type HolderCourseResult,
  type ReviewHolder,
} from '@/actions/certificates/queries'
import { fetchLevelDescriptions } from '@/actions/courses/level-descriptions'
import { getViewerContext } from '@/actions/viewer'
import { db } from '@/db/client'
import { parseCertificate } from '@/db/queries/certificate'
import { plainDescriptions } from '@/db/queries/skill-level-description'
import {
  activityEvents,
  assessments,
  certificateReviews,
  certificates,
  lessons,
  userAssessments,
  userCourses,
  users,
} from '@/db/schema'
import { CacheTag, certificatesOrgTag, certificatesTutorTag, certificatesUserTag, progressUserTag } from '@/lib/cache'

const DETAIL_LIFE = { expire: 3600, revalidate: 60, stale: 60 } as const

interface Access {
  organizationId: number
  reviewerId: string | null
  status: string
  userId: string | null
}

interface Viewer {
  id: string
  isAdmin: boolean
  organizations: { id: number; role: string }[]
}

const canView = (user: Viewer, cert: Access) => {
  const role = user.organizations.find(({ id }) => id === cert.organizationId)?.role
  const isOwner = cert.userId === user.id
  if (cert.status === 'draft') return isOwner
  const isManager = role === 'admin' || role === 'representative'
  const isPoolTutor = role === 'tutor' && cert.reviewerId === null && cert.status === 'submitted'
  const isReviewer = role === 'tutor' && cert.reviewerId === user.id
  return isOwner || isManager || isReviewer || isPoolTutor || user.isAdmin
}

const tagCertificate = (cert: Access) => {
  cacheTag(
    certificatesOrgTag(cert.organizationId),
    ...(cert.userId ? [certificatesUserTag(cert.userId)] : []),
    ...(cert.reviewerId ? [certificatesTutorTag(cert.reviewerId)] : [])
  )
}

const metadataText = (metadata: unknown, key: string) => {
  if (!metadata || typeof metadata !== 'object') return null
  const value = Reflect.get(metadata, key)
  return typeof value === 'string' && value ? value : null
}

const fetchCertificateRecord = async (id: number) => {
  'use cache'
  cacheLife(DETAIL_LIFE)
  cacheTag(CacheTag.Certificates)

  const cert = await db.query.certificates.findFirst({
    where: eq(certificates.id, id),
    with: { ...certificateWithUsers, rating: true },
  })
  if (!cert) return null
  tagCertificate(cert)
  return {
    access: {
      organizationId: cert.organizationId,
      reviewerId: cert.reviewerId,
      status: cert.status,
      userId: cert.userId,
    },
    certificate: parseCertificate(cert),
  }
}

export const fetchCertificateActivity = async (id: number) => {
  'use cache'
  cacheLife(DETAIL_LIFE)
  cacheTag(CacheTag.Certificates)

  const cert = await db.query.certificates.findFirst({
    columns: { id: true, organizationId: true, reviewerId: true, userId: true },
    where: eq(certificates.id, id),
  })
  if (!cert) return null
  tagCertificate({ ...cert, status: '' })

  const [rows, reviews] = await Promise.all([
    db
      .select({
        action: activityEvents.action,
        actorFirstName: users.firstName,
        actorLastName: users.lastName,
        createdAt: activityEvents.createdAt,
        id: activityEvents.id,
        metadata: activityEvents.metadata,
      })
      .from(activityEvents)
      .leftJoin(users, eq(users.id, activityEvents.actorId))
      .where(and(eq(activityEvents.subjectType, 'certificate'), eq(activityEvents.subjectId, String(id))))
      .orderBy(asc(activityEvents.createdAt), asc(activityEvents.id)),
    db.query.certificateReviews.findMany({
      columns: { comment: true, createdAt: true, decision: true, sectionComments: true },
      orderBy: (review, { desc: byDesc }) => [byDesc(review.createdAt)],
      where: and(eq(certificateReviews.certificateId, id), ne(certificateReviews.decision, 'approved')),
    }),
  ])

  const tutorIds = [...new Set(rows.flatMap(({ metadata }) => metadataText(metadata, 'tutorId') ?? []))]
  const tutors =
    tutorIds.length > 0
      ? await db
          .select({ firstName: users.firstName, id: users.id, lastName: users.lastName })
          .from(users)
          .where(inArray(users.id, tutorIds))
      : []
  const tutorById = new Map(tutors.map(({ id: tutorId, ...name }) => [tutorId, name]))

  const events: CertificateActivityEvent[] = rows.map(row => {
    const tutorId = metadataText(row.metadata, 'tutorId')
    return {
      action: row.action,
      actor: row.actorFirstName ? { firstName: row.actorFirstName, lastName: row.actorLastName } : null,
      comment: metadataText(row.metadata, 'comment'),
      createdAt: row.createdAt,
      id: row.id,
      reason: metadataText(row.metadata, 'reason'),
      tutor: tutorId ? (tutorById.get(tutorId) ?? null) : null,
    }
  })
  const [latest] = reviews
  const review: CertificateReviewNotes | null = latest
    ? {
        comment: latest.comment,
        createdAt: latest.createdAt,
        decision: latest.decision,
        sectionComments: latest.sectionComments,
      }
    : null
  return { events, review }
}

const fetchReviewContext = async (id: number) => {
  'use cache'
  cacheLife(DETAIL_LIFE)
  cacheTag(CacheTag.Certificates, CacheTag.Courses)

  const cert = await db.query.certificates.findFirst({
    columns: { id: true, organizationId: true, reviewerId: true, status: true, userId: true },
    where: eq(certificates.id, id),
    with: {
      skills: { columns: { courseId: true, level: true } },
      user: {
        columns: {
          birthPlace: true,
          birthday: true,
          email: true,
          firstName: true,
          lastName: true,
          nationality: true,
        },
      },
    },
  })
  if (!cert?.userId || !cert.user) return null
  const { user: holder, userId } = cert
  tagCertificate(cert)
  cacheTag(progressUserTag(userId))

  const courseIds = cert.skills.map(({ courseId }) => courseId)
  const [completions, assessmentRows, descriptions] = await Promise.all([
    db
      .select({ completedAt: userCourses.completedAt, courseId: userCourses.courseId })
      .from(userCourses)
      .where(and(eq(userCourses.userId, userId), inArray(userCourses.courseId, courseIds))),
    db
      .select({ courseId: lessons.courseId, reflection: userAssessments.reflection, value: userAssessments.value })
      .from(userAssessments)
      .innerJoin(assessments, eq(assessments.id, userAssessments.assessmentId))
      .innerJoin(lessons, eq(lessons.id, assessments.lessonId))
      .where(eq(userAssessments.userId, userId))
      .orderBy(asc(userAssessments.updatedAt)),
    fetchLevelDescriptions(courseIds),
  ])

  const results: Record<number, HolderCourseResult> = Object.fromEntries(
    courseIds.map(courseId => {
      const mine = assessmentRows.filter(row => row.courseId === courseId)
      const result: HolderCourseResult = {
        completedAt: completions.find(row => row.courseId === courseId)?.completedAt ?? null,
        descriptions: plainDescriptions(descriptions.data?.[courseId]),
        level: mine.findLast(row => row.value)?.value ?? null,
        pick: cert.skills.find(skill => skill.courseId === courseId)?.level ?? null,
        reflection: mine.findLast(row => row.reflection)?.reflection ?? null,
      }
      return [courseId, result]
    })
  )
  const reviewHolder: ReviewHolder = holder
  return { access: { ...cert }, holder: reviewHolder, results }
}

export const loadCertificate = async (id: number) => {
  const [{ user }, record] = await Promise.all([getViewerContext(), fetchCertificateRecord(id)])
  if (!record || !canView(user, record.access)) return null
  return record.access.userId === user.id ? record.certificate : { ...record.certificate, rating: null }
}

export const loadCertificateActivity = async (id: number) => {
  const [{ user }, access, activity] = await Promise.all([
    getViewerContext(),
    fetchCertificateRecord(id),
    fetchCertificateActivity(id),
  ])
  if (!access || !activity || !canView(user, access.access)) return null
  return activity
}

export const loadReviewContext = async (id: number) => {
  const [{ user }, record] = await Promise.all([getViewerContext(), fetchReviewContext(id)])
  const isTutor = user.organizations.some(
    ({ id: orgId, role }) => orgId === record?.access.organizationId && role === 'tutor'
  )
  if (!record || !isTutor || record.access.reviewerId !== user.id) return null
  return { holder: record.holder, results: record.results }
}
