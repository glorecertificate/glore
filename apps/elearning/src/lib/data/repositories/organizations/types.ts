import { type Timestamp } from '../../supabase'
import { type Entity } from '../types'

export interface Organization extends Entity<'organizations', Timestamp> {
  shortName: string
}

export interface Region extends Entity<'regions'> {}
