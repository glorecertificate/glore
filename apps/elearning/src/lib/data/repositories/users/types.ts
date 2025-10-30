import { type Enums } from 'supabase/types'

import { type Timestamp } from '../../supabase'
import { type Certificate } from '../certificates/types'
import { type BaseOrganization } from '../organizations/types'
import { type Entity } from '../types'

export type BaseUser = Omit<Entity<'users'>, 'phone'>

export interface User extends Entity<'users', never, Timestamp> {
  canEdit: boolean
  fullName: string | null
  initials: string[] | null
  isLearner: boolean
  organizations: UserOrganization[]
  phone: Entity<'users'>['phone']
  shortName: string | null
}

export interface CurrentUser extends User {
  certificates?: Certificate[]
}

export interface UserOrganization extends BaseOrganization {
  role: Enums<'role'>
}

export interface UserCourse extends Entity<'user_courses'> {}

export interface UserLesson extends Entity<'user_lessons'> {}

export interface UserAnswer extends Entity<'user_answers'> {}

export interface UserEvaluation extends Entity<'user_evaluations'> {}

export interface UserAssessment extends Entity<'user_assessments'> {}
