import { type InferSelectModel } from 'drizzle-orm'

import { type UserWithRelations, parseUser } from '@/db/queries/user'
import {
  type assessments,
  type contributions,
  type evaluations,
  type lessons,
  type questionOptions,
  type questions,
  type userAssessments,
  type userEvaluations,
} from '@/db/schema'
import { type IntlRecord } from '@/lib/i18n'

type LessonRow = InferSelectModel<typeof lessons>
type QuestionRow = InferSelectModel<typeof questions>
type QuestionOptionRow = InferSelectModel<typeof questionOptions>
type EvaluationRow = InferSelectModel<typeof evaluations>
type AssessmentRow = InferSelectModel<typeof assessments>
type UserAssessmentRow = Pick<InferSelectModel<typeof userAssessments>, 'id' | 'value'>
type UserEvaluationRow = Pick<InferSelectModel<typeof userEvaluations>, 'id' | 'value'>
type ContributionRow = InferSelectModel<typeof contributions> & { user: UserWithRelations }
type UserLessonCount = { id: number }[]

export interface LessonWithRelations extends LessonRow {
  userLessons?: UserLessonCount
  questions?: (QuestionRow & {
    options: (QuestionOptionRow & { userAnswers?: { id: number }[] })[]
  })[]
  assessment?: (AssessmentRow & { userAssessments: UserAssessmentRow[] }) | null
  evaluations?: (EvaluationRow & { userEvaluations: UserEvaluationRow[] })[]
  contributions?: ContributionRow[]
}

export type Lesson = ReturnType<typeof parseLesson>
export type LessonType = 'questions' | 'evaluations' | 'assessment' | 'reading'
export type Assessment = Exclude<Lesson['assessment'], undefined>
export type Evaluation = Lesson['evaluations'][number]
export type Question = Lesson['questions'][number]
export type QuestionOption = Question['options'][number]

export const parseLesson = (lesson: Partial<LessonWithRelations>) => {
  const assessment = lesson.assessment
    ? {
        ...lesson.assessment,
        userRating: lesson.assessment.userAssessments[0]?.value,
      }
    : undefined

  const questions =
    lesson.questions?.map(({ options, ...question }) => ({
      ...question,
      answered: options.some(option => (option.userAnswers ?? []).length > 0),
      options: options.map(({ userAnswers, ...option }) => ({
        ...option,
        isUserAnswer: (userAnswers ?? []).length > 0,
      })),
    })) ?? []

  const evaluations =
    lesson.evaluations?.map(({ userEvaluations, ...evaluation }) => ({
      ...evaluation,
      userRating: userEvaluations[0]?.value,
    })) ?? []

  let type: LessonType = 'reading'
  if (questions.length > 0) type = 'questions'
  if (evaluations.length > 0) type = 'evaluations'
  if (assessment) type = 'assessment'

  return {
    ...lesson,
    type,
    completed: (lesson.userLessons ?? []).length > 0,
    assessment,
    contributions:
      lesson.contributions?.map(contribution => ({
        ...contribution,
        user: parseUser(contribution.user),
      })) ?? [],
    evaluations,
    questions,
  }
}

export const DEFAULT_LESSON = {
  title: {
    en: 'New lesson',
    es: 'Nueva lección',
    it: 'Nuova lezione',
  } satisfies IntlRecord,
  content: null as IntlRecord | null,
}
