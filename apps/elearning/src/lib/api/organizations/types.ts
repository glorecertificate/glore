import { type Entity, type Timestamp } from '@/lib/api/types'

export interface BaseOrganization extends Entity<'organizations'> {}

export interface Organization extends Entity<'organizations', 'description', Timestamp> {}

export interface Region extends Entity<'regions'> {}
