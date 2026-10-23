import 'server-only'

import { eq, inArray } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { deleteTranslations } from '@/db/mutations/content-translation'
import {
  assessments,
  certificateSkills,
  contributions,
  courses,
  evaluations,
  lessons,
  questionOptions,
  questions,
  userAnswers,
  userAssessments,
  userCourses,
  userEvaluations,
  userLessons,
} from '@/db/schema'

export const deleteLessons = async (tx: Transaction, lessonIds: number[]) => {
  if (lessonIds.length === 0) return

  const questionIds = tx.select({ id: questions.id }).from(questions).where(inArray(questions.lessonId, lessonIds))
  const optionIds = tx
    .select({ id: questionOptions.id })
    .from(questionOptions)
    .where(inArray(questionOptions.questionId, questionIds))
  const evaluationIds = tx
    .select({ id: evaluations.id })
    .from(evaluations)
    .where(inArray(evaluations.lessonId, lessonIds))
  const assessmentIds = tx
    .select({ id: assessments.id })
    .from(assessments)
    .where(inArray(assessments.lessonId, lessonIds))

  await tx.delete(userAnswers).where(inArray(userAnswers.optionId, optionIds))
  await tx.delete(questionOptions).where(inArray(questionOptions.questionId, questionIds))
  await tx.delete(questions).where(inArray(questions.lessonId, lessonIds))
  await tx.delete(userEvaluations).where(inArray(userEvaluations.evaluationId, evaluationIds))
  await tx.delete(evaluations).where(inArray(evaluations.lessonId, lessonIds))
  await tx.delete(userAssessments).where(inArray(userAssessments.assessmentId, assessmentIds))
  await tx.delete(assessments).where(inArray(assessments.lessonId, lessonIds))
  await tx.delete(userLessons).where(inArray(userLessons.lessonId, lessonIds))
  await tx.delete(contributions).where(inArray(contributions.lessonId, lessonIds))
  await tx.delete(lessons).where(inArray(lessons.id, lessonIds))
  await deleteTranslations(tx, 'lesson', lessonIds)
}

export const deleteCourse = async (tx: Transaction, courseId: number) => {
  const lessonRows = await tx.select({ id: lessons.id }).from(lessons).where(eq(lessons.courseId, courseId))

  await deleteLessons(
    tx,
    lessonRows.map(({ id }) => id)
  )
  await tx.delete(userCourses).where(eq(userCourses.courseId, courseId))
  await tx.delete(certificateSkills).where(eq(certificateSkills.courseId, courseId))
  await tx.delete(courses).where(eq(courses.id, courseId))
  await deleteTranslations(tx, 'course', [courseId])
}

export const deleteQuestionOptions = async (tx: Transaction, optionIds: number[]) => {
  if (optionIds.length === 0) return

  await tx.delete(userAnswers).where(inArray(userAnswers.optionId, optionIds))
  await tx.delete(questionOptions).where(inArray(questionOptions.id, optionIds))
}

export const deleteQuestions = async (tx: Transaction, questionIds: number[]) => {
  if (questionIds.length === 0) return

  const optionIds = tx
    .select({ id: questionOptions.id })
    .from(questionOptions)
    .where(inArray(questionOptions.questionId, questionIds))

  await tx.delete(userAnswers).where(inArray(userAnswers.optionId, optionIds))
  await tx.delete(questionOptions).where(inArray(questionOptions.questionId, questionIds))
  await tx.delete(questions).where(inArray(questions.id, questionIds))
}

export const deleteEvaluations = async (tx: Transaction, evaluationIds: number[]) => {
  if (evaluationIds.length === 0) return

  await tx.delete(userEvaluations).where(inArray(userEvaluations.evaluationId, evaluationIds))
  await tx.delete(evaluations).where(inArray(evaluations.id, evaluationIds))
}

export const deleteAssessments = async (tx: Transaction, assessmentIds: number[]) => {
  if (assessmentIds.length === 0) return

  await tx.delete(userAssessments).where(inArray(userAssessments.assessmentId, assessmentIds))
  await tx.delete(assessments).where(inArray(assessments.id, assessmentIds))
}
