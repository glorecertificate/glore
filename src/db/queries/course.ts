import { lessonQuery, parseLesson } from '@/db/queries/lesson'
import { parseUser, userQuery } from '@/db/queries/user'
import { type DatabaseResult, type Enums } from '@/db/types'
import { type IntlRecord, i18n } from '@/lib/i18n'

export type PublicationStatus = 'archived' | 'draft' | 'partial' | 'published'
export type ProgressStatus = 'notStarted' | 'inProgress' | 'completed'
export type Course = ReturnType<typeof parseCourse>
export type SkillGroup = Exclude<Course['skill_group'], null>

export const COURSE_TYPES = ['intro', 'skill', 'learner'] satisfies Enums<'course_type'>[]
export const COURSE_SLUG_MIN_LENGTH = 3

export const DEFAULT_COURSE = {
  title: {
    en: 'New Course',
    es: 'Nuevo Curso',
    it: 'Nuovo Corso',
  } satisfies IntlRecord,
}

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
` as const

export const parseCourse = (course: DatabaseResult<'courses', typeof courseQuery>) => {
  const languages = course.languages ?? []
  const lessons = course.lessons.length > 0 ? course.lessons.map(parseLesson) : []
  const progress = Math.round((lessons.filter(lesson => lesson.completed).length / lessons.length) * 100)
  const creator = parseUser(course.creator)

  const contributions = [
    { id: 0, user: creator, created_at: course.created_at, updated_at: course.updated_at },
    ...lessons.flatMap(lesson => lesson.contributions ?? []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const publicationStatus: PublicationStatus = course.archived_at
    ? 'archived'
    : languages.length === 0
      ? 'draft'
      : languages.length < i18n.locales.length
        ? 'partial'
        : 'published'

  const progressStatus: ProgressStatus = progress === 0 ? 'notStarted' : progress === 100 ? 'completed' : 'inProgress'

  return {
    ...course,
    /* Overrides */
    languages,
    lessons,
    /* Computed */
    enrolled: course.user_courses.length > 0,
    progress,
    progressStatus,
    completed: progress === 100,
    publicationStatus,
    creator,
    contributions,
    contributors: contributions.map(({ user }) => parseUser(user)),
  }
}
