import { i18nConfig } from '@glore/i18n'
import { serialize } from '@glore/utils/serialize'
import { type Enum } from '@glore/utils/types'

import users, {
  type User,
  type UserAnswer,
  type UserAssessment,
  type UserCourse,
  type UserEvaluation,
  type UserLesson,
  parseUser,
  userQuery,
} from '@/lib/api/modules/users'
import { type Entity, createParser } from '@/lib/api/utils'
import { type DatabaseClient, DatabaseError, type Enums, type Tables, type Timestamp, timestamps } from '@/lib/db'

export const lessonQuery = `
  id,
  title,
  content,
  sortOrder:sort_order,
  ${timestamps},
  user_lessons(count),
  questions (
    id,
    description,
    explanation,
    options:question_options (
      id,
      content,
      isCorrect:is_correct,
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
    ${timestamps},
    user:users (
      ${userQuery}
    )
  )
`

export const courseQuery = `
  id,
  type,
  slug,
  title,
  description,
  icon,
  languages,
  sortOrder:sort_order,
  ${timestamps},
  archivedAt:archived_at,
  skillGroup:skill_groups (
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

export interface SkillGroup extends Entity<'skill_groups'> {}

export interface Course extends Entity<'courses', 'title' | 'description', Timestamp> {
  completed: boolean
  completion: number
  contributions: LessonContribution[]
  contributors: User[] & { count?: number }
  creator: User
  enrolled: boolean
  languages: Enums<'locale'>[]
  lessons: Lesson[]
  progress: Enum<CourseProgress>
  skillGroup: SkillGroup
  status: Enum<CourseStatus>
  type: Enums<'course_type'>
}

export enum CourseStatus {
  Draft = 'draft',
  Partial = 'partial',
  Published = 'published',
  Archived = 'archived',
}

export enum CourseProgress {
  NotStarted = 'not_started',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export interface CourseCreate extends Omit<Tables<'courses'>, 'id'> {}

export interface CourseUpdate extends Partial<Tables<'courses'>> {
  id: number
}

export enum LessonType {
  Reading = 'reading',
  Questions = 'questions',
  Evaluations = 'evaluations',
  Assessment = 'assessment',
}

export interface LessonContribution extends Entity<'contributions', never, Timestamp> {
  user: User
}

export interface Lesson extends Entity<'lessons', 'title' | 'content', Timestamp> {
  assessment?: Assessment
  completed: boolean
  contributions: LessonContribution[]
  evaluations?: Evaluation[]
  questions?: Question[]
  type: Enum<LessonType>
}

export interface Question extends Entity<'questions', 'description' | 'explanation'> {
  answered: boolean
  options: QuestionOption[]
}

export interface QuestionOption extends Entity<'question_options', 'content'> {
  isUserAnswer: boolean
}

export interface Evaluation extends Entity<'evaluations', 'description'> {
  userRating?: number
}

export interface Assessment extends Entity<'assessments', 'description'> {
  userRating?: number
}

export const parseCourse = createParser<'courses', typeof courseQuery, Course>(course => {
  const { creator: courseCreator, lessons: courseLessons, user_courses, ...rest } = course
  const languages = course.languages || []
  const status = course.archivedAt
    ? 'archived'
    : languages.length === 0
      ? 'draft'
      : languages.length < i18nConfig.locales.length
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

export const parseLesson = createParser<'lessons', typeof lessonQuery, Lesson>(({ user_lessons, ...lesson }) => {
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

  let type: LessonType = LessonType.Reading
  if (questions.length) type = LessonType.Questions
  if (evaluations.length) type = LessonType.Evaluations
  if (assessment) type = LessonType.Assessment

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

export const listCourses = async (db: DatabaseClient): Promise<Course[]> => {
  const { data, error } = await db.from('courses').select(courseQuery)

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return data.map(course => parseCourse(course))
}

export const findCourse = async (db: DatabaseClient, slug: string): Promise<Course> => {
  const { data, error } = await db.from('courses').select(courseQuery).eq('slug', slug).single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return parseCourse(data)
}

export const createCourse = async (db: DatabaseClient, course: CourseCreate): Promise<Course> => {
  const { data, error } = await db.from('courses').insert(course).select(courseQuery).single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return parseCourse(data)
}

export const updateCourse = async (db: DatabaseClient, course: CourseUpdate): Promise<Course> => {
  const { id, ...updates } = course
  const { data, error } = await db.from('courses').update(updates).eq('id', id).select(courseQuery).single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return parseCourse(data)
}

export const enrollUser = async (
  db: DatabaseClient,
  courseId: number,
  locale: Enums<'locale'>
): Promise<UserCourse> => {
  const user = await users.getCurrent(db)

  const { data, error } = await db
    .from('user_courses')
    .insert({ course_id: courseId, locale, user_id: user.id })
    .select()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return serialize(data[0])
}

export const completeLesson = async (db: DatabaseClient, id: number): Promise<UserLesson> => {
  const user = await users.getCurrent(db)

  const { data, error } = await db
    .from('user_lessons')
    .upsert([{ lesson_id: id, user_id: user.id }])
    .select('id')

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return serialize(data[0])
}

export const submitAnswers = async (db: DatabaseClient, answers: { id: number }[]): Promise<UserAnswer[]> => {
  const user = await users.getCurrent(db)

  const { data, error } = await db
    .from('user_answers')
    .insert(answers.map(({ id }) => ({ option_id: id, user_id: user.id })))
    .select('id')

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return serialize(data)
}

export const submitEvaluations = async (
  db: DatabaseClient,
  evaluations: { id: number; value: number }[]
): Promise<UserEvaluation[]> => {
  const user = await users.getCurrent(db)

  const { data, error } = await db
    .from('user_evaluations')
    .insert(evaluations.map(({ id, value }) => ({ evaluation_id: id, user_id: user.id, value })))
    .select('id, value')

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return serialize(data)
}

export const submitAssessment = async (db: DatabaseClient, id: number, value: number): Promise<UserAssessment> => {
  const user = await users.getCurrent(db)

  const { data, error } = await db
    .from('user_assessments')
    .insert({
      assessment_id: id,
      user_id: user.id,
      value,
    })
    .select('id, value')
    .single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return serialize(data)
}

export default {
  completeLesson,
  create: createCourse,
  enrollUser,
  find: findCourse,
  list: listCourses,
  submitAnswers,
  submitAssessment,
  submitEvaluations,
  update: updateCourse,
}
