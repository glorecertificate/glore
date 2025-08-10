import { type Locale } from 'use-intl'

import { type Skill } from '@/lib/api/courses/types'
import { type Organization } from '@/lib/api/organizations/types'
import { type Entity } from '@/lib/api/types'
import { type BaseUser } from '@/lib/api/users/types'

export interface Certificate extends Entity<'certificates', never, 'created_at' | 'updated_at'> {
  language: Locale
  organization: Organization
  reviewer: BaseUser | null
  skills: Skill[]
}
