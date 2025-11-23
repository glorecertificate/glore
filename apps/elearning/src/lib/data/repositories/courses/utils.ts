import { type IntlRecord, LOCALES } from '@/lib/intl'
import { parseUser } from '../users/utils'
import { createParser, withIntlKeys } from '../utils'
import { DEFAULT_LESSON } from './constants'
import { type courseQuery, type lessonQuery } from './queries'
import { type Course, type Lesson, type LessonType } from './types'

export const parseCourse = createParser<'courses', typeof courseQuery, Course>(course => {
  const { creator: courseCreator, lessons: courseLessons, user_courses, ...rest } = course
  const languages = course.languages ?? []
  const publicationStatus = course.archived_at
    ? 'archived'
    : languages.length === 0
      ? 'draft'
      : languages.length < LOCALES.length
        ? 'partial'
        : 'published'
  const lessons = courseLessons.length > 0 ? courseLessons.map(parseLesson) : [DEFAULT_LESSON as Lesson]
  const enrolled = user_courses.length > 0
  const progress = Math.round((lessons.filter(lesson => lesson.completed).length / lessons.length) * 100) || 0
  const progressStatus = progress === 0 ? 'not_started' : progress ? 'completed' : 'in_progress'
  const completed = progress === 100
  const creator = parseUser(courseCreator)
  const contributions = [
    {
      id: 0,
      user: creator,
      created_at: course.created_at,
      updated_at: course.updated_at,
    },
    ...lessons.flatMap(lesson => lesson.contributions ?? []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const contributors = [...new Set(contributions.map(contribution => contribution.user))].map(user => ({
    ...user,
    count: contributions.filter(contribution => contribution.user.id === user.id).length,
  }))

  return withIntlKeys(
    {
      ...rest,
      completed,
      contributions,
      contributors,
      creator,
      enrolled,
      languages,
      lessons,
      progress,
      progressStatus,
      publicationStatus,
      skillGroup: course.skill_group,
    } as const,
    ['title', 'description']
  )
})

export const parseLesson = createParser<'lessons', typeof lessonQuery, Lesson>(
  ({ title, content, user_lessons, ...lesson }) => {
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
      title: title as IntlRecord,
      content: content as IntlRecord,
      assessment,
      completed,
      contributions,
      evaluations,
      questions,
      type,
    }
  }
)
