import { type Certificate } from '@/api/modules/certificates/types'
import { type UserOrganization } from '@/api/modules/organizations/types'
import { type Entity } from '@/api/types'

export interface BaseUser extends Exclude<Entity<'users'>, 'phone'> {}

export interface User extends Entity<'users', 'created_at' | 'updated_at' | 'deleted_at'> {
  phone: Entity<'users'>['phone']
  organizations: UserOrganization[]
}

export interface CurrentUser extends User {
  certificates?: Certificate[]
}
