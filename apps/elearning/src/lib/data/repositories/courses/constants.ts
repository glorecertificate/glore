import { type Enums } from 'supabase/types'

import { type Course } from './types'

export const DEFAULT_COURSE_TITLE = {
  en: 'Untitled course',
  es: 'Nuevo curso',
  it: 'Nuovo corso',
} as const satisfies Course['title']

export const LESSON_TYPE = ['reading', 'questions', 'evaluations', 'assessment'] as const

export const COURSE_SLUG_REGEX = /^[a-z0-9-]+$/

export const COURSE_TYPES = ['intro', 'skill'] as const satisfies Enums<'course_type'>[]
