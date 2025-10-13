import { type Course } from './types'

export const DEFAULT_COURSE_TITLE = {
  en: 'Untitled course',
  es: 'Nuevo curso',
  it: 'Nuovo corso',
} as const satisfies Course['title']

export const LESSON_TYPE = ['reading', 'questions', 'evaluations', 'assessment'] as const
