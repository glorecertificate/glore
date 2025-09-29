import { type Entity, type Timestamp } from '@/lib/db'

export interface BaseOrganization extends Entity<'organizations'> {}

export interface Organization extends Entity<'organizations', 'description', Timestamp> {}

export interface Region extends Entity<'regions'> {}
