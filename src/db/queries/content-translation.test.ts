import { describe, expect, it } from 'vitest'

import {
  type TargetTranslations,
  type TranslationTarget,
  articleTarget,
  changedLocales,
  classifyTranslation,
  countStates,
  coverageOf,
  hasLocaleContent,
  languageChanges,
  lessonTarget,
  skillGroupTarget,
  sourceFingerprint,
  summarizeLocale,
  weakestState,
} from './content-translation'
import { isPublicArticle, redactArticle } from './doc'

const group = (overrides: Partial<Record<'en' | 'es' | 'it', string>> = {}): TranslationTarget =>
  skillGroupTarget({
    description: null,
    id: 3,
    name: { en: 'Communication', es: 'Comunicación', it: 'Comunicazione', ...overrides },
  })

describe('classifyTranslation', () => {
  it('reports missing when the locale has no content, whatever the row says', () => {
    expect(classifyTranslation(false, undefined, 'a')).toBe('missing')
    expect(classifyTranslation(false, { sourceHash: 'a', status: 'reviewed' }, 'a')).toBe('missing')
  })

  it('treats content without a row as a draft', () => {
    expect(classifyTranslation(true, undefined, 'a')).toBe('draft')
  })

  it('flags a row as outdated when the English hash moved on, before its own status', () => {
    expect(classifyTranslation(true, { sourceHash: 'old', status: 'reviewed' }, 'new')).toBe('outdated')
    expect(classifyTranslation(true, { sourceHash: 'old', status: 'machine' }, 'new')).toBe('outdated')
  })

  it('returns the stored status while the hash matches', () => {
    expect(classifyTranslation(true, { sourceHash: 'a', status: 'machine' }, 'a')).toBe('machine')
    expect(classifyTranslation(true, { sourceHash: 'a', status: 'draft' }, 'a')).toBe('draft')
    expect(classifyTranslation(true, { sourceHash: 'a', status: 'reviewed' }, 'a')).toBe('reviewed')
  })
})

describe('sourceFingerprint', () => {
  it('depends on the English text only', () => {
    expect(sourceFingerprint(group({ es: 'Otra cosa', it: 'Altro' }))).toBe(sourceFingerprint(group()))
    expect(sourceFingerprint(group({ en: 'Communicating' }))).not.toBe(sourceFingerprint(group()))
  })

  it('covers every nested field of a lesson', () => {
    const lesson = (option: string) =>
      lessonTarget({
        assessments: [{ description: { en: 'Rate yourself' }, id: 5 }],
        content: { en: [{ children: [{ text: 'Body' }], type: 'p' }] },
        evaluations: [],
        id: 1,
        questions: [
          {
            description: { en: 'Question?' },
            explanation: null,
            id: 2,
            options: [{ content: { en: option }, id: 9 }],
          },
        ],
        title: { en: 'Lesson' },
      })
    expect(sourceFingerprint(lesson('A'))).not.toBe(sourceFingerprint(lesson('B')))
    expect(lesson('A').fields.map(({ table }) => table)).toEqual([
      'lessons',
      'lessons',
      'questions',
      'questions',
      'question_options',
      'assessments',
    ])
  })
})

describe('hasLocaleContent', () => {
  it('ignores blanks and empty Plate paragraphs', () => {
    expect(hasLocaleContent(group({ es: '  ' }), 'es')).toBe(false)
    expect(hasLocaleContent(group(), 'es')).toBe(true)
    const lesson = lessonTarget({
      assessments: [],
      content: { en: [{ children: [{ text: 'Body' }], type: 'p' }], es: [{ children: [{ text: '' }], type: 'p' }] },
      evaluations: [],
      id: 1,
      questions: [],
      title: { en: '', es: '' },
    })
    expect(hasLocaleContent(lesson, 'es')).toBe(false)
    expect(hasLocaleContent(lesson, 'en')).toBe(true)
  })
})

describe('state helpers', () => {
  it('picks the weakest state', () => {
    expect(weakestState(['reviewed', 'draft', 'machine'])).toBe('machine')
    expect(weakestState(['reviewed', 'outdated', 'draft'])).toBe('outdated')
    expect(weakestState(['reviewed', 'missing'])).toBe('missing')
    expect(weakestState(['reviewed'])).toBe('reviewed')
  })

  it('counts translated and reviewed parts', () => {
    expect(countStates(['missing', 'machine', 'reviewed', 'outdated'])).toEqual({
      reviewed: 1,
      total: 4,
      translated: 3,
    })
  })

  it('summarizes one locale and builds coverage without the default locale', () => {
    const items: TargetTranslations[] = [
      {
        entityId: 1,
        entityType: 'course',
        locales: [
          { hasContent: true, locale: 'es', state: 'reviewed' },
          { hasContent: false, locale: 'it', state: 'missing' },
        ],
      },
      {
        entityId: 2,
        entityType: 'lesson',
        locales: [
          { hasContent: true, locale: 'es', state: 'machine' },
          { hasContent: true, locale: 'it', state: 'reviewed' },
        ],
      },
    ]
    expect(summarizeLocale(items, 'es')).toEqual({ hasContent: true, locale: 'es', state: 'machine' })
    expect(summarizeLocale(items, 'it').state).toBe('missing')
    expect(coverageOf(items)).toEqual([
      { locale: 'es', reviewed: 1, total: 2, translated: 2 },
      { locale: 'it', reviewed: 1, total: 2, translated: 1 },
    ])
  })
})

describe('languageChanges', () => {
  it('lists published and unpublished locales', () => {
    expect(languageChanges(['en'], ['en', 'es'])).toEqual([{ locale: 'es', published: true }])
    expect(languageChanges(['en', 'es'], ['en'])).toEqual([{ locale: 'es', published: false }])
    expect(languageChanges(null, ['en'])).toEqual([{ locale: 'en', published: true }])
    expect(languageChanges(['en'], ['en'])).toEqual([])
  })
})

describe('changedLocales', () => {
  it('finds the locales whose value moved', () => {
    expect(changedLocales({ en: 'a', es: 'b', it: 'c' }, { en: 'a', es: 'x', it: 'c' })).toEqual(['es'])
    expect(changedLocales(null, { en: 'a' })).toEqual(['en'])
    expect(changedLocales(null, null)).toEqual([])
  })
})

describe('public doc articles', () => {
  const article = {
    content: { en: 'English body', es: 'Cuerpo en español', it: 'Corpo italiano' },
    excerpt: { en: 'Short', es: 'Corto', it: 'Breve' },
    languages: ['en', 'it'],
    published: true,
    title: { en: 'Title', es: 'Título', it: 'Titolo' },
  }

  it('needs the master switch and at least one published locale', () => {
    expect(isPublicArticle(article)).toBe(true)
    expect(isPublicArticle({ ...article, languages: [] })).toBe(false)
    expect(isPublicArticle({ ...article, published: false })).toBe(false)
  })

  it('blanks the locales that are not published', () => {
    const result = redactArticle(article)
    expect(result.title).toEqual({ en: 'Title', es: '', it: 'Titolo' })
    expect(result.content).toEqual({ en: 'English body', es: '', it: 'Corpo italiano' })
    expect(result.excerpt).toEqual({ en: 'Short', es: '', it: 'Breve' })
  })

  it('keeps a missing excerpt missing', () => {
    expect(redactArticle({ ...article, excerpt: null }).excerpt).toBeNull()
  })
})

describe('articleTarget', () => {
  it('lists title, excerpt, and content', () => {
    const target = articleTarget({ content: { en: 'b' }, excerpt: null, id: 7, title: { en: 't' } })
    expect(target.fields.map(({ column }) => column)).toEqual(['title', 'excerpt', 'content'])
    expect(target.entityType).toBe('doc_article')
  })
})
