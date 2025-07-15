import { type Locale } from 'use-intl'

import { type Skill } from '@/api/modules/courses/types'
import { type Organization } from '@/api/modules/organizations/types'
import { type BaseUser } from '@/api/modules/users/types'
import { type Entity } from '@/api/types'

export interface Certificate extends Entity<'certificates', 'created_at' | 'updated_at'> {
  language: Locale
  organization: Organization
  reviewer: BaseUser | null
  skills: Skill[]
}
