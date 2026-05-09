import { type InferInsertModel } from 'drizzle-orm'

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
  type notifications,
  type organizationJoinRequests,
  type organizations,
  type pushSubscriptions,
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
  notifications: typeof notifications
  organization_join_requests: typeof organizationJoinRequests
  organizations: typeof organizations
  push_subscriptions: typeof pushSubscriptions
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

export interface Enums {
  certificate_status: 'draft' | 'submitted' | 'in_review' | 'changes_requested' | 'approved'
  course_type: 'intro' | 'skill' | 'learner'
  organization_request_status: 'accepted' | 'pending' | 'rejected'
  role: 'admin' | 'learner' | 'tutor' | 'representative' | 'volunteer'
}

export type EnumType<T extends keyof Enums> = Enums[T]
