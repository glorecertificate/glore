import { type InferInsertModel } from 'drizzle-orm'

import { certificateStatusEnum, courseTypeEnum, membershipRoleEnum, organizationRequestStatusEnum } from '@/db/schema'
import {
  type accounts,
  type assessments,
  type certificateSkills,
  type certificates,
  type contributions,
  type courses,
  type docArticles,
  type docCategories,
  type evaluations,
  type lessons,
  type memberships,
  type organizationJoinRequests,
  type organizations,
  type questionOptions,
  type questions,
  type regions,
  type sessions,
  type skillGroups,
  type teamInvitations,
  type userAnswers,
  type userAssessments,
  type userCourses,
  type userEvaluations,
  type userLessons,
  type users,
  type verifications,
} from '@/db/schema'

interface TableMap {
  accounts: typeof accounts
  assessments: typeof assessments
  certificates: typeof certificates
  certificate_skills: typeof certificateSkills
  contributions: typeof contributions
  courses: typeof courses
  doc_articles: typeof docArticles
  doc_categories: typeof docCategories
  evaluations: typeof evaluations
  lessons: typeof lessons
  memberships: typeof memberships
  organization_join_requests: typeof organizationJoinRequests
  organizations: typeof organizations
  question_options: typeof questionOptions
  questions: typeof questions
  regions: typeof regions
  sessions: typeof sessions
  skill_groups: typeof skillGroups
  team_invitations: typeof teamInvitations
  user_answers: typeof userAnswers
  user_assessments: typeof userAssessments
  user_courses: typeof userCourses
  user_evaluations: typeof userEvaluations
  user_lessons: typeof userLessons
  users: typeof users
  verifications: typeof verifications
}

export type TableInsert<T extends keyof TableMap> = InferInsertModel<TableMap[T]>
export type TableUpdate<T extends keyof TableMap> = Partial<InferInsertModel<TableMap[T]>>

interface Enums {
  certificate_status: (typeof certificateStatusEnum.enumValues)[number]
  course_type: (typeof courseTypeEnum.enumValues)[number]
  organization_request_status: (typeof organizationRequestStatusEnum.enumValues)[number]
  role: (typeof membershipRoleEnum.enumValues)[number]
}

export type EnumType<T extends keyof Enums> = Enums[T]
