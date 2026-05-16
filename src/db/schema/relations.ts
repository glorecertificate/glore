import { relations } from 'drizzle-orm'

import { accounts } from './accounts'
import { assessments, evaluations, questionOptions, questions } from './assessments'
import { certificateSkills, certificates } from './certificates'
import { contributions, courses, lessons } from './courses'
import { docArticles, docCategories } from './docs'
import { memberships, organizationJoinRequests, organizationProfiles, organizations } from './organizations'
import { userAnswers, userAssessments, userCourses, userEvaluations, userLessons } from './progress'
import { regions } from './regions'
import { sessions } from './sessions'
import { skillGroups } from './skill-groups'
import { teamInvitations } from './teams'
import { users } from './users'

/* Users */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  memberships: many(memberships),
  reviewedOrganizationJoinRequests: many(organizationJoinRequests, { relationName: 'organizationJoinRequestReviewer' }),
  regions: many(regions),
  contributions: many(contributions),
  certificates: many(certificates, { relationName: 'certificateUser' }),
  reviewedCertificates: many(certificates, { relationName: 'certificateReviewer' }),
  teamInvitations: many(teamInvitations, { relationName: 'invitee' }),
  invitedTeamInvitations: many(teamInvitations, { relationName: 'inviter' }),
  userCourses: many(userCourses),
  userLessons: many(userLessons),
  userAnswers: many(userAnswers),
  userAssessments: many(userAssessments),
  userEvaluations: many(userEvaluations),
  createdCourses: many(courses, { relationName: 'courseCreator' }),
  archivedCourses: many(courses, { relationName: 'courseArchivedBy' }),
}))

/* Sessions */
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

/* Accounts */
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

/* Organizations */
export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  memberships: many(memberships),
  joinRequests: many(organizationJoinRequests),
  profile: one(organizationProfiles, {
    fields: [organizations.id],
    references: [organizationProfiles.organizationId],
  }),
}))

export const organizationProfilesRelations = relations(organizationProfiles, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationProfiles.organizationId],
    references: [organizations.id],
  }),
}))

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  organization: one(organizations, { fields: [memberships.organizationId], references: [organizations.id] }),
}))

export const organizationJoinRequestsRelations = relations(organizationJoinRequests, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationJoinRequests.organizationId],
    references: [organizations.id],
  }),
  reviewer: one(users, {
    fields: [organizationJoinRequests.reviewedBy],
    references: [users.id],
    relationName: 'organizationJoinRequestReviewer',
  }),
}))

/* Regions */
export const regionsRelations = relations(regions, ({ one }) => ({
  coordinator: one(users, { fields: [regions.coordinatorId], references: [users.id] }),
}))

/* Skill Groups */
export const skillGroupsRelations = relations(skillGroups, ({ many }) => ({
  courses: many(courses),
}))

/* Courses */
export const coursesRelations = relations(courses, ({ one, many }) => ({
  creator: one(users, { fields: [courses.creatorId], references: [users.id], relationName: 'courseCreator' }),
  archivedBy: one(users, {
    fields: [courses.archivedById],
    references: [users.id],
    relationName: 'courseArchivedBy',
  }),
  skillGroup: one(skillGroups, { fields: [courses.skillGroupId], references: [skillGroups.id] }),
  lessons: many(lessons),
  userCourses: many(userCourses),
}))

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  contributions: many(contributions),
  questions: many(questions),
  evaluations: many(evaluations),
  assessments: many(assessments),
  userLessons: many(userLessons),
}))

export const contributionsRelations = relations(contributions, ({ one }) => ({
  lesson: one(lessons, { fields: [contributions.lessonId], references: [lessons.id] }),
  user: one(users, { fields: [contributions.userId], references: [users.id] }),
}))

/* Assessments */
export const questionsRelations = relations(questions, ({ one, many }) => ({
  lesson: one(lessons, { fields: [questions.lessonId], references: [lessons.id] }),
  options: many(questionOptions),
}))

export const questionOptionsRelations = relations(questionOptions, ({ one, many }) => ({
  question: one(questions, { fields: [questionOptions.questionId], references: [questions.id] }),
  userAnswers: many(userAnswers),
}))

export const evaluationsRelations = relations(evaluations, ({ one, many }) => ({
  lesson: one(lessons, { fields: [evaluations.lessonId], references: [lessons.id] }),
  userEvaluations: many(userEvaluations),
}))

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  lesson: one(lessons, { fields: [assessments.lessonId], references: [lessons.id] }),
  userAssessments: many(userAssessments),
}))

/* Progress */
export const userCoursesRelations = relations(userCourses, ({ one }) => ({
  user: one(users, { fields: [userCourses.userId], references: [users.id] }),
  course: one(courses, { fields: [userCourses.courseId], references: [courses.id] }),
}))

export const userLessonsRelations = relations(userLessons, ({ one }) => ({
  user: one(users, { fields: [userLessons.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [userLessons.lessonId], references: [lessons.id] }),
}))

export const userAnswersRelations = relations(userAnswers, ({ one }) => ({
  user: one(users, { fields: [userAnswers.userId], references: [users.id] }),
  option: one(questionOptions, { fields: [userAnswers.optionId], references: [questionOptions.id] }),
}))

export const userAssessmentsRelations = relations(userAssessments, ({ one }) => ({
  user: one(users, { fields: [userAssessments.userId], references: [users.id] }),
  assessment: one(assessments, { fields: [userAssessments.assessmentId], references: [assessments.id] }),
}))

export const userEvaluationsRelations = relations(userEvaluations, ({ one }) => ({
  user: one(users, { fields: [userEvaluations.userId], references: [users.id] }),
  evaluation: one(evaluations, { fields: [userEvaluations.evaluationId], references: [evaluations.id] }),
}))

/* Certificates */
export const certificatesRelations = relations(certificates, ({ one, many }) => ({
  user: one(users, { fields: [certificates.userId], references: [users.id], relationName: 'certificateUser' }),
  organization: one(organizations, { fields: [certificates.organizationId], references: [organizations.id] }),
  reviewer: one(users, {
    fields: [certificates.reviewerId],
    references: [users.id],
    relationName: 'certificateReviewer',
  }),
  skills: many(certificateSkills),
}))

export const certificateSkillsRelations = relations(certificateSkills, ({ one }) => ({
  certificate: one(certificates, { fields: [certificateSkills.certificateId], references: [certificates.id] }),
  course: one(courses, { fields: [certificateSkills.courseId], references: [courses.id] }),
}))

/* Team */
export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  user: one(users, { fields: [teamInvitations.userId], references: [users.id], relationName: 'invitee' }),
  inviter: one(users, { fields: [teamInvitations.invitedBy], references: [users.id], relationName: 'inviter' }),
}))

/* Docs */
export const docCategoriesRelations = relations(docCategories, ({ many }) => ({
  articles: many(docArticles),
}))

export const docArticlesRelations = relations(docArticles, ({ one }) => ({
  category: one(docCategories, { fields: [docArticles.categoryId], references: [docCategories.id] }),
}))
