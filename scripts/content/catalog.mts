import { type Value } from 'platejs'

import { type CourseType, LOCALES, type Locale, type Localized } from './config.mts'
import { type LessonFile, type LoadedContent, type LoadedLesson, type SkillGroupInput } from './load.mts'
import { markdownToPlate } from './markdown.mts'

interface CatalogQuestion {
  description: Localized
  explanation: Localized
  options: { content: Localized; isCorrect: boolean }[]
}

export interface CatalogLesson {
  number: number
  title: Localized
  content: Localized<Value>
  questions: CatalogQuestion[]
  evaluations: Localized[]
  assessment: Localized | null
}

export interface CatalogCourse {
  slug: string
  example: boolean
  type: CourseType
  skillGroup: string | null
  icon: string
  title: Localized
  description: Localized
  durationMinutes: number
  outcomes: Localized<string[]>
  sortOrder: number
  lessons: CatalogLesson[]
}

export interface Catalog {
  groups: SkillGroupInput[]
  courses: CatalogCourse[]
}

const localize = <T,>(pick: (locale: Locale) => T) =>
  Object.fromEntries(LOCALES.map(locale => [locale, pick(locale)])) as Localized<T>

const buildLesson = ({ files, number }: LoadedLesson): CatalogLesson => {
  const file = (locale: Locale) => files[locale] as LessonFile
  const reference = file(LOCALES[0])
  return {
    assessment: reference.assessment ? localize(locale => file(locale).assessment as string) : null,
    content: localize(locale => markdownToPlate(file(locale).body)),
    evaluations: reference.evaluations.map((_, index) => localize(locale => file(locale).evaluations[index])),
    number,
    questions: reference.questions.map((question, index) => ({
      description: localize(locale => file(locale).questions[index].question),
      explanation: localize(locale => file(locale).questions[index].explanation),
      options: question.options.map((option, optionIndex) => ({
        content: localize(locale => file(locale).questions[index].options[optionIndex].text),
        isCorrect: option.correct,
      })),
    })),
    title: localize(locale => file(locale).title),
  }
}

export const buildCatalog = (content: LoadedContent): Catalog => ({
  courses: content.courses
    .flatMap(({ example, lessons, meta }) =>
      meta
        ? [
            {
              description: meta.description,
              durationMinutes: meta.durationMinutes,
              example,
              icon: meta.icon,
              lessons: lessons.map(buildLesson),
              outcomes: meta.outcomes,
              skillGroup: meta.skillGroup ?? null,
              slug: meta.slug,
              sortOrder: meta.sortOrder,
              title: meta.title,
              type: meta.type,
            } satisfies CatalogCourse,
          ]
        : []
    )
    .toSorted((a, b) => a.type.localeCompare(b.type) || a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug)),
  groups: content.groups.toSorted((a, b) => a.sortOrder - b.sortOrder),
})
