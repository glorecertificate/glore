import { type Timestamp } from '../../supabase'
import { type Entity } from '../types'

export interface BaseOrganization extends Entity<'organizations'> {}
export interface Organization extends Entity<'organizations', 'description', Timestamp> {}
export interface Region extends Entity<'regions'> {}
