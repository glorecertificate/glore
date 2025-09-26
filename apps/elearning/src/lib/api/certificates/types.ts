import { type Locale } from '@repo/i18n'

import { type BaseUser, type Course, type Organization } from '@/lib/api'
import { type Entity } from '@/lib/db'

export interface Certificate extends Entity<'certificates', never, 'created_at' | 'updated_at'> {
  language: Locale
  organization: Organization
  reviewer: BaseUser | null
  skills: Course[]
}
