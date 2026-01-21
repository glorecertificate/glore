import { parseUser, userQuery } from '@/db/schema/users'
import { type DatabaseResult } from '@/db/types'

export type Lesson = ReturnType<typeof parseLesson>
export type LessonType = 'questions' | 'evaluations' | 'assessment' | 'reading'
export type Assessment = Exclude<Lesson['assessment'], undefined>
export type Evaluation = Lesson['evaluations'][number]
export type Question = Lesson['questions'][number]
export type QuestionOption = Question['options'][number]

export const lessonQuery = `
  id,
  title,
  content,
  sort_order,
  created_at,
  updated_at,
  user_lessons(count),
  questions (
    id,
    description,
    explanation,
    options:question_options (
      id,
      content,
      is_correct,
      user_answers(count)
    )
  ),
  assessment:assessments (
    id,
    description,
    user_assessments (
      id,
      value
    )
  ),
  evaluations (
    id,
    description,
    user_evaluations (
      id,
      value
    )
  ),
  contributions (
    id,
    created_at,
    updated_at,
    user:users (
      ${userQuery}
    )
  )
` as const

export const parseLesson = ({ user_lessons = [], ...lesson }: DatabaseResult<'lessons', typeof lessonQuery>) => {
  const assessment = lesson.assessment
    ? {
        ...lesson.assessment,
        userRating: lesson.assessment.user_assessments[0]?.value,
      }
    : undefined

  const questions = lesson.questions.map(({ options, ...question }) => ({
    ...question,
    answered: options.some(option => (option.user_answers ?? []).length > 0),
    options: options.map(({ user_answers, ...option }) => ({
      ...option,
      isUserAnswer: user_answers.length > 0,
    })),
  }))

  const evaluations = lesson.evaluations.map(({ user_evaluations, ...evaluation }) => ({
    ...evaluation,
    userRating: user_evaluations[0]?.value,
  }))

  let type: LessonType = 'reading'
  if (questions.length > 0) type = 'questions'
  if (evaluations.length > 0) type = 'evaluations'
  if (assessment) type = 'assessment'

  return {
    ...lesson,
    type,
    completed: user_lessons.length > 0,
    assessment,
    contributions: lesson.contributions.map(contribution => ({
      ...contribution,
      user: parseUser(contribution.user),
    })),
    evaluations,
    questions,
  }
}
