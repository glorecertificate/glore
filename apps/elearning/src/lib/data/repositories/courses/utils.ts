import { LOCALES } from '@/lib/intl'
import { parseUser, type UserRecord } from '../users/utils'
import { createParser } from '../utils'
import { type Course, type Lesson, type LessonType } from './types'

export interface LessonContributionRecord {
  createdAt: string
  id: number
  updatedAt: string
  user: UserRecord
}

interface LessonQuestionOptionRecord {
  id: number
  content: unknown
  isCorrect: boolean
  user_answers: unknown[]
}

interface LessonQuestionRecord {
  id: number
  description: unknown
  explanation: unknown
  options: LessonQuestionOptionRecord[]
}

interface LessonAssessmentRecord {
  id: number
  description: unknown
  user_assessments: Array<{ value: number }>
}

interface LessonEvaluationRecord {
  id: number
  description: unknown
  user_evaluations: Array<{ value: number }>
}

export interface LessonRecord {
  id: number
  title: unknown
  content: unknown
  sortOrder: number
  createdAt: string
  updatedAt: string
  assessment: LessonAssessmentRecord | null
  evaluations: LessonEvaluationRecord[]
  contributions: LessonContributionRecord[]
  questions: LessonQuestionRecord[]
  user_lessons: unknown[]
  [key: string]: unknown
}

export interface CourseRecord {
  id: number
  type: string | null
  slug: string
  title: unknown
  description: unknown
  icon: string | null
  languages: string[] | null
  sortOrder: number | null
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  skillGroup: {
    id: number
    name: unknown
  } | null
  creator: UserRecord
  lessons: LessonRecord[]
  user_courses: unknown[]
  [key: string]: unknown
}

export const parseCourse = createParser<CourseRecord, Course>(course => {
  const { creator: courseCreator, lessons: courseLessons, user_courses, ...rest } = course
  const languages = course.languages ?? []
  const status = course.archivedAt
    ? 'archived'
    : languages.length === 0
      ? 'draft'
      : languages.length < LOCALES.length
        ? 'partial'
        : 'published'
  const lessons = courseLessons.map(parseLesson)
  const enrolled = user_courses.length > 0
  const completion = Math.round((lessons.filter(lesson => lesson.completed).length / lessons.length) * 100) || 0
  const completed = completion === 100
  const progress = completion === 0 ? 'not_started' : completed ? 'completed' : 'in_progress'
  const creator = parseUser(courseCreator)
  const contributions = [
    {
      createdAt: course.createdAt,
      id: 0,
      updatedAt: course.createdAt,
      user: creator,
    },
    ...lessons.flatMap(lesson => lesson.contributions),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const contributors = [...new Set(contributions.map(contribution => contribution.user))].map(user => ({
    ...user,
    count: contributions.filter(contribution => contribution.user.id === user.id).length,
  }))

  return {
    ...rest,
    completed,
    completion,
    contributions,
    contributors,
    creator,
    enrolled,
    languages,
    lessons,
    progress,
    status,
  } as Course
})

export const parseLesson = createParser<LessonRecord, Lesson>(({ user_lessons, ...lesson }) => {
  const questions = lesson.questions.map(({ options, ...question }) => ({
    ...question,
    answered: options.some(option => option.user_answers.length > 0),
    options: options.map(({ user_answers, ...option }) => ({
      ...option,
      isUserAnswer: user_answers.length > 0,
    })),
  }))
  const assessment = lesson.assessment
    ? {
        ...lesson.assessment,
        userRating: lesson.assessment.user_assessments[0]?.value,
      }
    : undefined
  const evaluations = lesson.evaluations.map(({ user_evaluations, ...evaluation }) => ({
    ...evaluation,
    userRating: user_evaluations[0]?.value,
  }))
  const contributions = lesson.contributions.map(contribution => ({
    ...contribution,
    user: parseUser(contribution.user),
  }))

  let type: LessonType = 'reading'
  if (questions.length) type = 'questions'
  if (evaluations.length) type = 'evaluations'
  if (assessment) type = 'assessment'

  const completed = user_lessons.length > 0

  return {
    ...lesson,
    assessment,
    completed,
    contributions,
    evaluations,
    questions,
    type,
  } as Lesson
})
