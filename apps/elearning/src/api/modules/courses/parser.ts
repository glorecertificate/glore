import { parseUser } from '@/api/modules/users/parser'
import { createParser } from '@/api/utils'

import { type courseQuery, type lessonQuery, type skillQuery } from './queries'
import type { Course, Lesson, Skill } from './types'

export const parseCourse = createParser<'courses', typeof courseQuery, Course>(course => {
  const { creator: courseCreator, lessons: courseLessons, skill: courseSkill, user_courses, ...rest } = course
  const skill = courseSkill ? parseSkill(courseSkill) : undefined
  const lessons = courseLessons.map(parseLesson)
  const enrolled = user_courses.length > 0
  const lessonsCount = lessons.length
  const lessonsCompleted = lessons.filter(lesson => lesson.completed).length
  const progress = Math.round((lessonsCompleted / lessonsCount) * 100) || 0
  const completed = progress === 100
  const status = progress === 0 ? 'not_started' : completed ? 'completed' : 'in_progress'
  const creator = parseUser(courseCreator)

  return {
    ...rest,
    skill,
    lessons,
    enrolled,
    progress,
    completed,
    creator,
    lessonsCount,
    lessonsCompleted,
    status,
  } as Course
})

export const parseSkill = createParser<'skills', typeof skillQuery, Skill>(
  ({ area, user_assessments, ...skill }) =>
    ({
      ...skill,
      area: area ?? undefined,
      userRating: user_assessments[0]?.value,
    }) as Skill,
)

export const parseLesson = createParser<'lessons', typeof lessonQuery, Lesson>(
  ({ assessment, evaluations, questions, user_lessons, ...lesson }) =>
    ({
      ...lesson,
      completed: user_lessons.length > 0,
      questions: questions.map(({ options, ...question }) => ({
        ...question,
        options: options.map(({ user_answers, ...option }) => ({
          ...option,
          isUserAnswer: user_answers.length > 0,
        })),
        answered: options.some(option => option.user_answers.length > 0),
      })),
      assessment: assessment
        ? {
            ...assessment,
            userRating: assessment.user_assessments[0]?.value,
          }
        : undefined,
      evaluations: evaluations.map(({ user_evaluations, ...evaluation }) => ({
        ...evaluation,
        userRating: user_evaluations[0]?.value,
      })),
    }) as Lesson,
)
