import { type Timestamp } from '../../supabase'
import { type Course } from '../courses/types'
import { type Organization } from '../organizations/types'
import { type Entity } from '../types'
import { type BaseUser } from '../users/types'

export interface Certificate extends Entity<'certificates', Timestamp> {
  organization: Organization
  reviewer: BaseUser | null
  skills: Course[]
}
