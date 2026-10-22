import { z } from 'zod'

import { COURSE_TYPES, ICON_NAMES, LOCALES } from './config.mts'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

const SLUG_MIN_LENGTH = 3
export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 6

const text = z.string().trim().min(1, 'must not be empty')

const localized = <T extends z.ZodType>(value: T) =>
  z.strictObject(Object.fromEntries(LOCALES.map(locale => [locale, value])) as Record<(typeof LOCALES)[number], T>)

const slug = z
  .string()
  .min(SLUG_MIN_LENGTH, `must have at least ${SLUG_MIN_LENGTH} characters`)
  .regex(SLUG_REGEX, 'must be lower-case kebab-case')

const icon = z.string().refine(name => ICON_NAMES.has(name), 'must be a lucide icon name listed in config/icons.json')

const sortOrder = z.number().int().positive()

const skillGroupSchema = z.strictObject({
  slug,
  icon,
  sortOrder,
  name: localized(text),
  description: localized(text),
})

export const skillGroupsSchema = z.array(skillGroupSchema).min(1)

export const courseSchema = z.strictObject({
  slug,
  type: z.enum(COURSE_TYPES),
  skillGroup: slug.optional(),
  icon,
  title: localized(text),
  description: localized(text),
  durationMinutes: z.number().int().min(5).max(600),
  outcomes: localized(z.array(text).min(1).max(8)),
  sortOrder,
})

const optionSchema = z.strictObject({
  text,
  correct: z.boolean().optional(),
})

const questionSchema = z.strictObject({
  question: text,
  options: z.array(optionSchema),
  explanation: text,
})

export const lessonFrontMatterSchema = z.strictObject({
  title: text,
  questions: z.array(questionSchema).optional(),
  evaluations: z.array(text).optional(),
  assessment: text.optional(),
})

const DOC_TITLE_MAX = 200
const DOC_EXCERPT_MAX = 1000
const DOC_CATEGORY_DESCRIPTION_MAX = 1000
const DOC_SLUG_MAX = 100

const docSlug = slug.max(DOC_SLUG_MAX, `must have at most ${DOC_SLUG_MAX} characters`)

export const docCategoriesSchema = z
  .array(
    z.strictObject({
      slug: docSlug,
      sortOrder,
      title: localized(text.max(DOC_TITLE_MAX)),
      description: localized(text.max(DOC_CATEGORY_DESCRIPTION_MAX)),
    })
  )
  .min(1)

export const docSchema = z.strictObject({
  slug: docSlug,
  sortOrder,
})

export const docFrontMatterSchema = z.strictObject({
  title: text.max(DOC_TITLE_MAX),
  excerpt: text.max(DOC_EXCERPT_MAX),
})
