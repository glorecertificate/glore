import { type IntlRecord } from '@/lib/intl'
import { type Enums } from '../../../../../supabase/types'
import { type Course, type Lesson } from './types'

export const DEFAULT_LESSON = {
  title: {
    en: 'Untitled lesson',
    es: 'Lección sin título',
    it: 'Lezione senza titolo',
  } satisfies IntlRecord,
  type: 'reading',
} as const satisfies Partial<Lesson>

export const DEFAULT_COURSE = {
  title: {
    en: 'Untitled course',
    es: 'Curso sin título',
    it: 'Corso senza titolo',
  } satisfies IntlRecord,
  lessons: [DEFAULT_LESSON as Lesson],
} as const satisfies Partial<Course>

export const LESSON_TYPE = ['reading', 'questions', 'evaluations', 'assessment'] as const

export const COURSE_SLUG_REGEX = /^(?!.*--)(?!.*-$)[a-z0-9-]+$/

export const COURSE_TYPES = ['intro', 'skill'] as const satisfies Enums<'course_type'>[]
