import { type User } from '@/api/modules/users/types'
import type { Entity, Timestamp } from '@/api/types'

export type CourseStatus = 'not_started' | 'in_progress' | 'completed'

export interface Course extends Entity<'courses', 'title' | 'description', Timestamp> {
  skill?: Skill
  lessons?: Lesson[]
  creator?: User
  enrolled: boolean
  progress: number
  status: CourseStatus
  lessonsCount: number
  lessonsCompleted: number
  completed: boolean
}

export interface Skill extends Entity<'skills', 'name' | 'description', Timestamp> {
  area?: Entity<'skill_areas'>
  userRating?: number
}

export interface Lesson extends Entity<'lessons', 'title' | 'content', Timestamp> {
  completed: boolean
  questions?: Question[]
  assessment?: Assessment
  evaluations?: Evaluation[]
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
