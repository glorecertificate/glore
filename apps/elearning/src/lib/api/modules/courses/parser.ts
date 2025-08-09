import { parseUser } from '@/lib/api/modules/users/parser'
import { createParser } from '@/lib/api/utils'

import { type courseQuery, type lessonQuery, type skillQuery } from './queries'
import { CourseType, LessonType, type Course, type Lesson, type Skill } from './types'

export const parseCourse = createParser<'courses', typeof courseQuery, Course>(course => {
  const { creator: courseCreator, lessons: courseLessons, skill: courseSkill, user_courses, ...rest } = course
  const skill = courseSkill ? parseSkill(courseSkill) : undefined
  const type = course.skill ? CourseType.Skill : CourseType.Introduction
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
    type,
    lessons,
    lessonsCount,
    lessonsCompleted,
    enrolled,
    progress,
    status,
    completed,
    creator,
  } as Course
})

export const parseSkill = createParser<'skills', typeof skillQuery, Skill>(
  ({ group, user_assessments, ...skill }) =>
    ({
      ...skill,
      group: group ?? undefined,
      userRating: user_assessments[0]?.value,
    }) as Skill,
)

export const parseLesson = createParser<'lessons', typeof lessonQuery, Lesson>(({ user_lessons, ...lesson }) => {
  const questions = lesson.questions.map(({ options, ...question }) => ({
    ...question,
    options: options.map(({ user_answers, ...option }) => ({
      ...option,
      isUserAnswer: user_answers.length > 0,
    })),
    answered: options.some(option => option.user_answers.length > 0),
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

  let type: LessonType = LessonType.Reading
  if (questions.length) type = LessonType.Questions
  if (evaluations.length) type = LessonType.Evaluations
  if (assessment) type = LessonType.Assessment

  const completed = user_lessons.length > 0

  return {
    ...lesson,
    type,
    questions,
    assessment,
    evaluations,
    completed,
  } as Lesson
})
