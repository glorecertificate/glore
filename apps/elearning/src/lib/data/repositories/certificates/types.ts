import { type Timestamp } from '../../supabase'
import { type Course } from '../courses'
import { type Organization } from '../organizations'
import { type Entity } from '../types'
import { type BaseUser } from '../users'

export interface Certificate extends Entity<'certificates', never, Timestamp> {
  organization: Organization
  reviewer: BaseUser | null
  skills: Course[]
}
