import { type Entity, type Timestamp } from '@/api/types'

export interface BaseOrganization extends Entity<'organizations'> {}

export interface Organization extends Entity<'organizations', 'description', Timestamp> {}

export interface Region extends Entity<'regions'> {}
