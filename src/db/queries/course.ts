import { type InferSelectModel } from 'drizzle-orm'
import { type Locale } from 'next-intl'

import { type LessonWithRelations, parseLesson } from '@/db/queries/lesson'
import { type UserWithRelations, parseUser } from '@/db/queries/user'
import { type courses, type skillGroups } from '@/db/schema'
import { type EnumType } from '@/db/types'
import { type IntlRecord, i18n } from '@/lib/i18n'

type CourseRow = InferSelectModel<typeof courses>
type SkillGroupRow = Pick<InferSelectModel<typeof skillGroups>, 'id' | 'name'> | null

interface CourseWithRelations extends CourseRow {
  skillGroup: SkillGroupRow
  creator: UserWithRelations
  lessons: LessonWithRelations[]
  userCourses: { id: number }[]
}

type PublicationStatus = 'archived' | 'draft' | 'partial' | 'published'
type ProgressStatus = 'notStarted' | 'inProgress' | 'completed'
export type Course = ReturnType<typeof parseCourse>
export type SkillGroup = Exclude<Course['skillGroup'], null>

export const COURSE_TYPES = ['intro', 'skill', 'learner'] satisfies EnumType<'course_type'>[]
export const COURSE_SLUG_MIN_LENGTH = 3

const DEFAULT_COURSE = {
  title: {
    en: 'New Course',
    es: 'Nuevo Curso',
    it: 'Nuovo Corso',
  } satisfies IntlRecord,
}

export const parseCourse = (course: CourseWithRelations) => {
  const title = course.title ?? DEFAULT_COURSE.title
  const type = course.type ?? 'intro'
  const languages = (course.languages ?? []) as Locale[]
  const lessons = course.lessons.length > 0 ? course.lessons.map(parseLesson) : []
  const progress = Math.round((lessons.filter(lesson => lesson.completed).length / lessons.length) * 100)
  const creator = parseUser(course.creator)

  const contributions = [
    { id: 0, user: creator, createdAt: course.createdAt, updatedAt: course.updatedAt },
    ...lessons.flatMap(lesson => lesson.contributions ?? []),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const publicationStatus: PublicationStatus = course.archivedAt
    ? 'archived'
    : languages.length === 0
      ? 'draft'
      : languages.length < i18n.locales.length
        ? 'partial'
        : 'published'

  const progressStatus: ProgressStatus = progress === 0 ? 'notStarted' : progress === 100 ? 'completed' : 'inProgress'

  return {
    ...course,
    title,
    type,
    languages,
    lessons,
    enrolled: course.userCourses.length > 0,
    enrollmentCount: course.userCourses.length,
    progress,
    progressStatus,
    completed: progress === 100,
    publicationStatus,
    creator,
    contributions,
    contributors: contributions.map(({ user }) => parseUser(user)),
  }
}
