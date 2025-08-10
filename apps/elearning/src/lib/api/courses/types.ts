import { type Enum } from '@repo/utils/types'

import type { Entity, Timestamp } from '@/lib/api/types'
import { type User } from '@/lib/api/users/types'

export enum CourseType {
  Introduction = 'introduction',
  Skill = 'skill',
}

export enum CourseStatus {
  NotStarted = 'not_started',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export interface Course extends Entity<'courses', 'title' | 'description', Timestamp> {
  skill?: Skill
  type: CourseType
  lessons?: Lesson[]
  lessonsCount: number
  lessonsCompleted: number
  enrolled: boolean
  progress: number
  status: Enum<CourseStatus>
  completed: boolean
  creator?: User
}

export interface Skill extends Entity<'skills', 'name' | 'description', Timestamp> {
  group?: Entity<'skill_groups'>
  userRating?: number
}

export enum LessonType {
  Reading = 'reading',
  Questions = 'questions',
  Evaluations = 'evaluations',
  Assessment = 'assessment',
}

export interface Lesson extends Entity<'lessons', 'title' | 'content', Timestamp> {
  type: Enum<LessonType>
  questions?: Question[]
  assessment?: Assessment
  evaluations?: Evaluation[]
  completed: boolean
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
