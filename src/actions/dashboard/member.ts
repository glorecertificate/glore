import 'server-only'

import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { type Locale } from 'next-intl'

import { findCertificateActivity, listUserCertificates } from '@/actions/certificates/queries'
import { findSkillCompass, getSkillProgress } from '@/actions/courses/data'
import {
  type MemberCourseRow,
  type MemberSummary,
  type ReviewSection,
  type VolunteerSummary,
  learnerChecklist,
  pickCurrentCertificate,
  summarizeMemberCourses,
  volunteerJourney,
} from '@/actions/dashboard/core'
import { listNotifications } from '@/actions/notifications/inbox'
import {
  type HolderProfile,
  certificateWizardValues,
  emptyWizardValues,
  resumeStep,
} from '@/components/features/certificates/new/values'
import { missingPersonalData } from '@/components/features/certificates/rules'
import { db } from '@/db/client'
import { type Certificate } from '@/db/queries/certificate'
import { enrollableTypes, evaluateEligibility, pickLocale, recommendFromCompass } from '@/db/queries/learning'
import { courses, userCourses, userLessons, users } from '@/db/schema'
import { type EnumType } from '@/db/types'
import { fullName } from '@/lib/utils'
import appConfig from '~/config/app.json'

const NOTIFICATION_PREVIEW = 5

const findMemberCourses = async (userId: string, role: 'learner' | 'volunteer', language: Locale) => {
  const rows = await db.query.courses.findMany({
    columns: {
      icon: true,
      id: true,
      languages: true,
      skillGroupId: true,
      slug: true,
      sortOrder: true,
      title: true,
      type: true,
    },
    orderBy: [asc(courses.sortOrder), asc(courses.id)],
    where: and(isNull(courses.archivedAt), inArray(courses.type, enrollableTypes(role))),
    with: {
      lessons: {
        columns: { id: true },
        with: { userLessons: { columns: { id: true }, where: eq(userLessons.userId, userId) } },
      },
      userCourses: { columns: { completedAt: true, updatedAt: true }, where: eq(userCourses.userId, userId) },
    },
  })
  return rows.map((row): MemberCourseRow => ({
    completedAt: row.userCourses[0]?.completedAt ?? null,
    done: row.lessons.filter(lesson => lesson.userLessons.length > 0).length,
    enrolled: row.userCourses.length > 0,
    icon: row.icon,
    id: row.id,
    languages: row.languages,
    skillGroupId: row.skillGroupId,
    slug: row.slug,
    sortOrder: row.sortOrder,
    title: pickLocale(row.title, language) ?? row.slug,
    total: row.lessons.length,
    type: (row.type ?? 'intro') as EnumType<'course_type'>,
    updatedAt: row.userCourses[0]?.updatedAt ?? null,
  }))
}

interface Holder extends HolderProfile {
  firstName: string
}

const findTutorName = async (id: string) => {
  const tutor = await db.query.users.findFirst({
    columns: { firstName: true, lastName: true },
    where: eq(users.id, id),
  })
  return tutor ? fullName(tutor) : null
}

const draftStep = (certificate: Certificate, holder: Holder, language: Locale) => {
  const values = certificateWizardValues(certificate, emptyWizardValues(language, holder))
  return resumeStep(values, missingPersonalData(holder))
}

const findReviewNotes = async (certificate: Certificate) => {
  if (!certificate.isChangesRequested) return null
  const { data } = await findCertificateActivity(certificate.id)
  return data?.review ?? null
}

export const loadLearnerSummary = async ({
  language,
  userId,
}: {
  language: Locale
  userId: string
}): Promise<MemberSummary> => {
  const [rows, notifications] = await Promise.all([
    findMemberCourses(userId, 'learner', language),
    listNotifications({ limit: NOTIFICATION_PREVIEW }),
  ])
  const summary = summarizeMemberCourses(rows, [], recommendFromCompass)
  return { checklist: learnerChecklist(summary), courses: summary, notifications: notifications.data?.items ?? [] }
}

export const loadVolunteerSummary = async ({
  holder,
  language,
  organizationId,
  userId,
}: {
  holder: Holder
  language: Locale
  organizationId: number | null
  userId: string
}): Promise<VolunteerSummary> => {
  const [rows, compass, progress, certificates] = await Promise.all([
    findMemberCourses(userId, 'volunteer', language),
    findSkillCompass(userId),
    getSkillProgress(userId),
    listUserCertificates(),
  ])

  const result = evaluateEligibility(progress, appConfig)
  const inOrganization = (certificates.data ?? []).filter(item => item.organizationId === organizationId)
  const certificate = pickCurrentCertificate(inOrganization)
  const reviewerId = certificate?.isOpen ? certificate.reviewerId : null

  const [resume, notes, tutor] = await Promise.all([
    certificate?.isDraft ? draftStep(certificate, holder, language) : 0,
    certificate ? findReviewNotes(certificate) : null,
    reviewerId ? findTutorName(reviewerId) : null,
  ])

  const completed = new Set(progress.completedCourseIds)
  const sections = Object.entries(notes?.sectionComments ?? {}).flatMap(([section, comment]) =>
    comment ? [section as ReviewSection] : []
  )

  return {
    certificate,
    compassSet: (compass?.goals.length ?? 0) + (compass?.strengths.length ?? 0) > 0,
    courses: summarizeMemberCourses(rows, compass?.goals ?? [], recommendFromCompass),
    eligibility: {
      completedSkillCount: result.completed,
      eligible: result.eligible,
      minSkills: appConfig.minSkills,
    },
    journey: volunteerJourney({ eligible: result.eligible, resume, sections, status: certificate?.status ?? null }),
    review: certificate?.isOpen ? { comment: notes?.comment ?? certificate.reviewerComment ?? null, tutor } : null,
    skills: rows.flatMap(row =>
      row.type === 'skill' && completed.has(row.id)
        ? [{ icon: row.icon, id: row.id, slug: row.slug, title: row.title }]
        : []
    ),
  }
}
