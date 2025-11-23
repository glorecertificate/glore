import { type Enum } from '@glore/utils/types'

import { type IntlRecord } from '@/lib/intl'
import { type Tables } from '../../../../../supabase/types'
import { type Timestamp } from '../../supabase'
import { type LESSON_TYPE } from '../courses/constants'
import { type Entity } from '../types'
import { type User } from '../users/types'

export interface SkillGroup extends Entity<'skill_groups'> {}

export interface Course extends Entity<'courses', Timestamp, 'title' | 'description'> {
  completed: boolean
  contributions: LessonContribution[]
  contributors: User[] & { count?: number }
  creator: User
  enrolled: boolean
  lessons: Lesson[]
  progress: number
  progressStatus: Enum<CourseProgressStatus>
  publicationStatus: Enum<CoursePublicationStatus>
  skillGroup: SkillGroup | null
}

export enum CoursePublicationStatus {
  Draft = 'draft',
  Partial = 'partial',
  Published = 'published',
  Archived = 'archived',
}

export enum CourseProgressStatus {
  NotStarted = 'not_started',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export interface CourseInsert extends Pick<Tables<'courses'>, 'slug' | 'skill_group_id' | 'type'> {}

export interface CourseUpdate extends Partial<Omit<Course, 'id'>> {
  id: number
}

export interface Lesson extends Entity<'lessons', Timestamp, 'title' | 'content'> {
  assessment?: Assessment
  completed: boolean
  contributions: LessonContribution[]
  evaluations?: Evaluation[]
  questions?: Question[]
  type: LessonType
}

export type LessonType = (typeof LESSON_TYPE)[number]

export interface LessonContribution extends Entity<'contributions', Timestamp> {
  user: User
}

export interface LessonUpsert extends Partial<Omit<Lesson, 'id'>> {
  id?: number
  course_id: number
  sort_order: number
  title: IntlRecord
}

export interface Question extends Entity<'questions'> {
  answered: boolean
  options: QuestionOption[]
}

export interface QuestionOption extends Entity<'question_options'> {
  isUserAnswer: boolean
}

export interface Evaluation extends Entity<'evaluations'> {
  userRating?: number
}

export interface Assessment extends Entity<'assessments'> {
  userRating?: number
}
