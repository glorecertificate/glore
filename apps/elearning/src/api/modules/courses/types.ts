import { type User } from '@/api/modules/users/types'
import type { Entity } from '@/api/types'

export interface Course extends Entity<'courses', 'created_at' | 'updated_at'> {
  skill?: Skill
  lessons?: Lesson[]
  creator?: User
  enrolled: boolean
  progress: number
  status: 'not_started' | 'in_progress' | 'completed'
  lessonsCount: number
  lessonsCompleted: number
  completed: boolean
}

export interface Skill extends Entity<'skills', 'created_at' | 'updated_at'> {
  area?: Entity<'skill_areas'>
  userRating?: number
}

export interface Lesson extends Entity<'lessons', 'created_at' | 'updated_at'> {
  completed: boolean
  questions?: Question[]
  assessment?: Assessment
  evaluations?: Evaluation[]
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

export interface UserCourse extends Entity<'user_courses'> {}

export interface UserLesson extends Entity<'user_lessons'> {}

export interface UserAnswer extends Entity<'user_answers'> {}

export interface UserEvaluation extends Entity<'user_evaluations'> {}

export interface UserAssessment extends Entity<'user_assessments'> {}
