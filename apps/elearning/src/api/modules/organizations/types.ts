import { type Entity } from '@/api/types'

export interface BaseOrganization extends Entity<'organizations'> {}

export interface Organization extends Entity<'organizations', 'created_at' | 'updated_at' | 'deleted_at'> {}

export interface Region extends Entity<'regions'> {}
