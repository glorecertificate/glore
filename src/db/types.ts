import { type InferInsertModel } from 'drizzle-orm'

import {
  certificateReviewDecisionEnum,
  certificateStatusEnum,
  contentEntityTypeEnum,
  contentTranslationStatusEnum,
  courseTypeEnum,
  membershipRoleEnum,
  organizationRequestStatusEnum,
  skillCompassKindEnum,
} from '@/db/schema'
import {
  type accounts,
  type activityEvents,
  type assessments,
  type certificateReviews,
  type certificateSkills,
  type certificates,
  type contentTranslations,
  type contributions,
  type courseRatings,
  type courses,
  type docArticles,
  type docCategories,
  type evaluations,
  type lessons,
  type memberships,
  type notifications,
  type organizationInvitations,
  type organizationInviteLinks,
  type organizationJoinRequests,
  type organizationRatings,
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
  type userSkillCompass,
  type users,
  type verifications,
} from '@/db/schema'

interface TableMap {
  accounts: typeof accounts
  activity_events: typeof activityEvents
  assessments: typeof assessments
  certificates: typeof certificates
  certificate_reviews: typeof certificateReviews
  certificate_skills: typeof certificateSkills
  content_translations: typeof contentTranslations
  contributions: typeof contributions
  course_ratings: typeof courseRatings
  courses: typeof courses
  doc_articles: typeof docArticles
  doc_categories: typeof docCategories
  evaluations: typeof evaluations
  lessons: typeof lessons
  memberships: typeof memberships
  notifications: typeof notifications
  organization_invitations: typeof organizationInvitations
  organization_invite_links: typeof organizationInviteLinks
  organization_join_requests: typeof organizationJoinRequests
  organization_ratings: typeof organizationRatings
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
  user_skill_compass: typeof userSkillCompass
  users: typeof users
  verifications: typeof verifications
}

export type TableInsert<T extends keyof TableMap> = InferInsertModel<TableMap[T]>
export type TableUpdate<T extends keyof TableMap> = Partial<InferInsertModel<TableMap[T]>>

interface Enums {
  certificate_review_decision: (typeof certificateReviewDecisionEnum.enumValues)[number]
  certificate_status: (typeof certificateStatusEnum.enumValues)[number]
  content_entity_type: (typeof contentEntityTypeEnum.enumValues)[number]
  content_translation_status: (typeof contentTranslationStatusEnum.enumValues)[number]
  course_type: (typeof courseTypeEnum.enumValues)[number]
  organization_request_status: (typeof organizationRequestStatusEnum.enumValues)[number]
  role: (typeof membershipRoleEnum.enumValues)[number]
  skill_compass_kind: (typeof skillCompassKindEnum.enumValues)[number]
}

export type EnumType<T extends keyof Enums> = Enums[T]
