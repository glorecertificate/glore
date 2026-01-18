import { type DatabaseResult } from '@/db/types'
import { i18n } from '@/lib/i18n'
import { lessonQuery, parseLesson } from './lessons'
import { parseUser, userQuery } from './users'

export type Course = ReturnType<typeof parseCourse>
export type SkillGroup = Exclude<Course['skillGroup'], null>

export const courseQuery = `
  id,
  type,
  slug,
  title,
  description,
  icon,
  languages,
  sort_order,
  created_at,
  updated_at,
  archived_at,
  skill_group:skill_groups (
    id,
    name
  ),
  creator:users (
    ${userQuery}
  ),
  lessons (
    ${lessonQuery}
  ),
  user_courses(count)
`

export const parseCourse = (data: DatabaseResult<'courses', typeof courseQuery>) => {
  const { creator: courseCreator, lessons: courseLessons, skill_group, user_courses, ...course } = data
  const languages = course.languages ?? []
  const publicationStatus = course.archived_at
    ? 'archived'
    : languages.length === 0
      ? 'draft'
      : languages.length < i18n.locales.length
        ? 'partial'
        : 'published'
  const lessons = courseLessons.length > 0 ? courseLessons.map(parseLesson) : []
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

  return {
    ...course,
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
    skillGroup: skill_group,
  }
}
