import { type Enum } from '@glore/utils/types'

import { type IntlRecord } from '@/lib/intl'
import { type Enums, type Tables, type Timestamp } from '../../supabase'
import { type LESSON_TYPE } from '../courses'
import { type Entity } from '../types'
import { type User } from '../users'

export interface SkillGroup extends Entity<'skill_groups'> {}

export interface Course extends Entity<'courses', 'title' | 'description', Timestamp> {
  archivedAt: string | null
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
  title: IntlRecord
  description: IntlRecord
  createdAt: string
  updatedAt: string
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

export interface CreateCourseOptions extends Pick<Tables<'courses'>, 'slug' | 'skill_group_id' | 'title' | 'type'> {}

export interface UpdateCourseOptions extends Partial<Tables<'courses'>> {
  id: number
}

export type LessonType = (typeof LESSON_TYPE)[number]

export interface LessonContribution extends Entity<'contributions', never, Timestamp> {
  user: User
}

export interface Lesson extends Entity<'lessons', 'title' | 'content', Timestamp> {
  assessment?: Assessment
  completed: boolean
  contributions: LessonContribution[]
  evaluations?: Evaluation[]
  questions?: Question[]
  type: LessonType
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
