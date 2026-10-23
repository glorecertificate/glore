import 'server-only'

import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { type Locale } from 'next-intl'

import { listUserCertificates } from '@/actions/certificates/queries'
import { findSkillCompass, getSkillProgress } from '@/actions/courses/data'
import {
  type EligibilityView,
  type MemberCourseRow,
  type MemberSummary,
  memberChecklist,
  memberJourney,
  pickCurrentCertificate,
  summarizeMemberCourses,
} from '@/actions/dashboard/core'
import { listNotifications } from '@/actions/notifications/inbox'
import { db } from '@/db/client'
import { enrollableTypes, evaluateEligibility, pickLocale, recommendFromCompass } from '@/db/queries/learning'
import { courses, userCourses, userLessons } from '@/db/schema'
import { type EnumType } from '@/db/types'
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

export const loadMemberSummary = async ({
  language,
  organizationId,
  role,
  userId,
}: {
  language: Locale
  organizationId: number | null
  role: 'learner' | 'volunteer'
  userId: string
}): Promise<MemberSummary> => {
  const isVolunteer = role === 'volunteer'
  const [rows, compass, progress, certificates, notifications] = await Promise.all([
    findMemberCourses(userId, role, language),
    isVolunteer ? findSkillCompass(userId) : null,
    isVolunteer ? getSkillProgress(userId) : null,
    isVolunteer ? listUserCertificates() : null,
    listNotifications({ limit: NOTIFICATION_PREVIEW }),
  ])

  const goals = compass?.goals ?? []
  const summary = summarizeMemberCourses(rows, goals, recommendFromCompass)
  const base = { courses: summary, notifications: notifications.data?.items ?? [] }

  if (!(isVolunteer && progress)) {
    return {
      ...base,
      certificate: null,
      checklist: memberChecklist('learner', {
        compassSet: false,
        eligible: false,
        hasRequested: false,
        skillsCompleted: 0,
        skillsRequired: appConfig.minSkills,
        summary,
      }),
      eligibility: null,
      journey: null,
    }
  }

  const result = evaluateEligibility(progress, appConfig)
  const eligibility: EligibilityView = {
    avgRating: progress.averageRating,
    completedSkillCount: result.completed,
    eligible: result.eligible,
    hasLowRatings: result.lowRating,
    minRating: appConfig.minRating,
    minSkills: appConfig.minSkills,
  }
  const inOrganization = (certificates?.data ?? []).filter(item => item.organizationId === organizationId)
  const certificate = pickCurrentCertificate(inOrganization)

  return {
    ...base,
    certificate,
    checklist: memberChecklist('volunteer', {
      compassSet: goals.length + (compass?.strengths.length ?? 0) > 0,
      eligible: result.eligible,
      hasRequested: inOrganization.some(item => item.status !== 'draft'),
      skillsCompleted: result.completed,
      skillsRequired: appConfig.minSkills,
      summary,
    }),
    eligibility,
    journey: memberJourney({ eligible: result.eligible, status: certificate?.status ?? null }),
  }
}
