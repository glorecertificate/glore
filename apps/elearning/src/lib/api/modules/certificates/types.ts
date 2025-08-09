import { type Locale } from 'use-intl'

import { type Skill } from '@/lib/api/modules/courses/types'
import { type Organization } from '@/lib/api/modules/organizations/types'
import { type BaseUser } from '@/lib/api/modules/users/types'
import { type Entity } from '@/lib/api/types'

export interface Certificate extends Entity<'certificates', never, 'created_at' | 'updated_at'> {
  language: Locale
  organization: Organization
  reviewer: BaseUser | null
  skills: Skill[]
}
