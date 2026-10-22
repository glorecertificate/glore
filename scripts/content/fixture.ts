import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { CONTENT_DIR, LOCALES } from './config.mts'

export const FIXTURE_SLUG = 'sample-skill'

const WORDS: Record<string, string> = { en: 'English', es: 'Spanish', it: 'Italian' }

export const courseJson = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify(
    {
      description: Object.fromEntries(LOCALES.map(locale => [locale, `Description ${WORDS[locale]}`])),
      durationMinutes: 20,
      icon: 'book-open',
      outcomes: Object.fromEntries(LOCALES.map(locale => [locale, [`Outcome ${WORDS[locale]}`]])),
      skillGroup: 'work-skills',
      slug: FIXTURE_SLUG,
      sortOrder: 1,
      title: Object.fromEntries(LOCALES.map(locale => [locale, `Title ${WORDS[locale]}`])),
      type: 'skill',
      ...overrides,
    },
    null,
    2
  )

export const lessonText = (locale: string, frontMatter: string, body = 'A short body.') =>
  `---\ntitle: Lesson ${WORDS[locale]}\n${frontMatter}---\n\n${body}\n`

export const questionYaml = (correctIndex = 1, options = 3) =>
  `questions:\n  - question: Which one?\n    options:\n${Array.from({ length: options }, (_, index) => `      - text: Option ${index + 1}${index === correctIndex ? '\n        correct: true' : ''}`).join('\n')}\n    explanation: Because.\n`

export const createFixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'glore-content-'))
  cpSync(join(CONTENT_DIR, 'skill-groups.json'), join(root, 'skill-groups.json'))
  const base = `courses/${FIXTURE_SLUG}`

  const write = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }

  write(`${base}/course.json`, courseJson())
  for (const locale of LOCALES) {
    write(`${base}/lessons/1.${locale}.md`, lessonText(locale, questionYaml(), 'Read this first.'))
    write(
      `${base}/lessons/2.${locale}.md`,
      lessonText(locale, 'evaluations:\n  - I can do it.\nassessment: How do you rate yourself?\n')
    )
  }

  return { base, remove: () => rmSync(root, { force: true, recursive: true }), root, write }
}

export const DOC_CATEGORY = 'fixture-guides'
export const DOC_SLUGS = ['fixture-first', 'fixture-second']

export const docCategoriesJson = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify(
    [
      {
        description: Object.fromEntries(LOCALES.map(locale => [locale, `Category description ${WORDS[locale]}`])),
        slug: DOC_CATEGORY,
        sortOrder: 1,
        title: Object.fromEntries(LOCALES.map(locale => [locale, `Category ${WORDS[locale]}`])),
        ...overrides,
      },
    ],
    null,
    2
  )

export const docText = (locale: string, body = '## Part\n\nA short paragraph.', frontMatter = '') =>
  `---\ntitle: Doc ${WORDS[locale]}\nexcerpt: Excerpt ${WORDS[locale]}\n${frontMatter}---\n\n${body}\n`

interface DocOptions {
  body?: string
  category?: string
}

export const createDocsFixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'glore-docs-'))
  cpSync(join(CONTENT_DIR, 'skill-groups.json'), join(root, 'skill-groups.json'))

  const write = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }

  const writeDoc = (slug: string, sortOrder: number, { body, category = DOC_CATEGORY }: DocOptions = {}) => {
    write(`docs/${category}/${slug}/doc.json`, JSON.stringify({ slug, sortOrder }))
    for (const locale of LOCALES) write(`docs/${category}/${slug}/${locale}.md`, docText(locale, body))
  }

  write('docs/categories.json', docCategoriesJson())
  DOC_SLUGS.forEach((slug, index) => writeDoc(slug, index + 1))

  return { remove: () => rmSync(root, { force: true, recursive: true }), root, write, writeDoc }
}
