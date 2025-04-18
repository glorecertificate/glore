import { type Entity } from '@/api/types'
import { type Enums } from 'supabase/types'

export interface BaseOrganization extends Entity<'organizations'> {}

export interface Organization extends Entity<'organizations', 'created_at' | 'updated_at' | 'deleted_at'> {}

export interface UserOrganization extends BaseOrganization {
  role: Enums<'organization_role'>
}
