import 'server-only'

import { type Locale } from 'next-intl'

import {
  findCompletedEnrollment,
  findLessonScope,
  findOptionGrade,
  findSkillOptions,
  getSkillProgress,
  hasEligibilityEvent,
  loadLearnerLesson,
} from '@/actions/courses/data'
import { transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { completeLessonRecords, replaceSkillCompass, saveAnswer, saveCourseRating } from '@/db/mutations/learning'
import { type AppEvent } from '@/db/queries/activity-event'
import {
  type CompassIssue,
  type CompletionInput,
  type CompletionIssue,
  type RatingIssue,
  checkCompletion,
  courseAccess,
  evaluateEligibility,
  normalizeCourseRating,
  pickLocale,
  validateCompass,
} from '@/db/queries/learning'
import { type EnumType } from '@/db/types'
import appConfig from '~/config/app.json'

export interface Learner {
  canEdit: boolean
  organizationId: number | null
  role: EnumType<'role'> | null
  userId: string
}

type LearningError = 'FORBIDDEN' | 'NOT_FOUND'

const scopeAccess = async (learner: Learner, lessonId: number) => {
  const scope = await findLessonScope(lessonId, learner.userId)
  if (!scope) return { error: 'NOT_FOUND' as const, ok: false as const }
  const access = courseAccess(learner, scope.course)
  if (!access) return { error: 'FORBIDDEN' as const, ok: false as const }
  if (access === 'learner') {
    if (!scope.enrolled) return { error: 'FORBIDDEN' as const, ok: false as const }
    const frontier = scope.lessons.findIndex(lesson => !lesson.completed)
    const index = scope.lessons.findIndex(lesson => lesson.id === lessonId)
    if (frontier !== -1 && index > frontier) return { error: 'FORBIDDEN' as const, ok: false as const }
  }
  return { access, ok: true as const, scope }
}

export interface AnswerResult {
  correct: boolean
  correctOptionId: number | null
  explanation: string | null
  saved: boolean
}

export const gradeAnswer = async (
  learner: Learner,
  input: { language: Locale; optionId: number; questionId: number }
): Promise<{ data: AnswerResult } | { error: LearningError }> => {
  const grade = await findOptionGrade(input.questionId, input.optionId)
  if (!grade) return { error: 'NOT_FOUND' }
  const checked = await scopeAccess(learner, grade.lessonId)
  if (!checked.ok) return { error: checked.error }

  const explanation = pickLocale(grade.explanation, input.language)
  const result = { correct: grade.correct, correctOptionId: grade.correct ? input.optionId : null, explanation }
  if (checked.access !== 'learner') return { data: { ...result, saved: false } }

  const lesson = await loadLearnerLesson(grade.lessonId, learner.userId, input.language)
  const question = lesson?.questions.find(({ id }) => id === input.questionId)
  if (question?.solved) return { data: { ...result, correctOptionId: question.correctOptionId, saved: false } }

  await saveAnswer(learner.userId, input.optionId)
  return { data: { ...result, saved: true } }
}

export interface CompletionResult {
  courseCompleted: boolean
  events: AppEvent[]
  saved: boolean
}

export const finishLesson = async (
  learner: Learner,
  input: CompletionInput & { language: Locale; lessonId: number }
): Promise<{ data: CompletionResult } | { error: CompletionIssue | LearningError }> => {
  const checked = await scopeAccess(learner, input.lessonId)
  if (!checked.ok) return { error: checked.error }
  if (checked.access !== 'learner') return { data: { courseCompleted: false, events: [], saved: false } }

  const lesson = await loadLearnerLesson(input.lessonId, learner.userId, input.language)
  if (!lesson) return { error: 'NOT_FOUND' }
  if (lesson.completed) return { data: { courseCompleted: false, events: [], saved: false } }

  const checkedInput = checkCompletion(lesson, input)
  if (checkedInput.issue) return { error: checkedInput.issue }

  const { course } = checked.scope
  const event: AppEvent<'course.completed'> = {
    actorId: learner.userId,
    data: { courseId: course.courseId, courseSlug: course.slug, userId: learner.userId },
    organizationId: learner.organizationId,
    type: 'course.completed',
  }
  const result = await transaction(async tx => {
    const done = await completeLessonRecords(tx, {
      assessment: checkedInput.assessment,
      courseId: course.courseId,
      lessonId: input.lessonId,
      ratings: checkedInput.ratings,
      userId: learner.userId,
    })
    if (done.courseCompleted) await recordEvent(tx, event)
    return done
  })

  const events: AppEvent[] = result.courseCompleted ? [event] : []
  if (result.courseCompleted && course.type === 'skill') {
    const eligible = evaluateEligibility(await getSkillProgress(learner.userId), appConfig).eligible
    if (eligible && !(await hasEligibilityEvent(learner.userId))) {
      const eligibility: AppEvent<'learning.eligible'> = {
        actorId: learner.userId,
        data: { userId: learner.userId },
        organizationId: learner.organizationId,
        type: 'learning.eligible',
      }
      await transaction(tx => recordEvent(tx, eligibility))
      events.push(eligibility)
    }
  }

  return { data: { courseCompleted: result.courseCompleted, events, saved: true } }
}

export const rateCompletedCourse = async (
  learner: Learner,
  input: { comment?: string | null; courseId: number; rating: number }
): Promise<{ data: { slug: string } } | { error: LearningError | RatingIssue }> => {
  const normalized = normalizeCourseRating(input)
  if (normalized.issue) return { error: normalized.issue }
  if (learner.canEdit) return { error: 'FORBIDDEN' }

  const enrollment = await findCompletedEnrollment(learner.userId, input.courseId)
  if (!enrollment) return { error: 'FORBIDDEN' }

  await saveCourseRating({
    comment: normalized.comment,
    courseId: input.courseId,
    rating: normalized.rating,
    userId: learner.userId,
  })
  return { data: enrollment }
}

export const saveCompass = async (
  learner: Learner,
  input: { goals: number[]; strengths: number[] },
  language: Locale
): Promise<{ data: { saved: true } } | { error: CompassIssue | LearningError }> => {
  if (learner.canEdit || learner.role !== 'volunteer') return { error: 'FORBIDDEN' }
  const options = await findSkillOptions(learner.userId, language)
  const checked = validateCompass(input, new Set(options.map(({ id }) => id)))
  if (checked.issue) return { error: checked.issue }

  await transaction(tx =>
    replaceSkillCompass(tx, { goals: input.goals, strengths: input.strengths, userId: learner.userId })
  )
  return { data: { saved: true } }
}
