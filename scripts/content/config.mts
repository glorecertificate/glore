import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { type Locale as AppLocale } from 'next-intl'

export type Locale = AppLocale

export type Localized<T = string> = Record<Locale, T>

export type CourseType = 'intro' | 'learner' | 'skill'

const ROOT = join(import.meta.dirname, '..', '..')

const readJson = <T,>(path: string) => JSON.parse(readFileSync(join(ROOT, path), 'utf8')) as T

export const CONTENT_DIR = join(ROOT, 'content')

export const LOCALES = Object.keys(
  readJson<{ locales: Record<string, unknown> }>('config/i18n.json').locales
) as Locale[]

export const ICON_NAMES = new Set(readJson<{ name: string }[]>('config/icons.json').map(({ name }) => name))

export const COURSE_TYPES = ['intro', 'learner', 'skill'] as const

export const LOCAL_DATABASE_REGEX = /@(localhost|127\.0\.0\.1)(:|\/)/u
