import { type UserModule } from '@/api/modules'
import { type Tables } from '@/services/db'

export interface User extends Omit<Tables<'profiles'>, 'avatar_url'> {
  avatar_url?: string
  modules: UserModule[]
  name: string
  orgs: UserOrg[]
}

export interface UserOrg extends Pick<Tables<'organizations'>, 'id' | 'name' | 'avatar_url' | 'country'> {
  isActive: boolean
  role: Tables<'user_organizations'>['role']
}
