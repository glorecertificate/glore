import { describe, expect, it } from 'vitest'

import { ArticleSaveError, buildArticlePayload } from '@/components/features/docs/article-editor/payload'

const draft = {
  audiences: ['volunteer' as const, 'tutor' as const],
  categoryId: 3,
  contents: { en: '## Hi', es: '', it: 'Ciao' },
  excerpts: { en: '', es: '', it: '' },
  languages: ['en' as const],
  slug: ' hello ',
  titles: { en: 'Hello', es: '', it: 'Ciao' },
}

describe('payload', () => {
  it('keeps the published languages when saving a draft', () => {
    expect(buildArticlePayload(draft, 'it', null)).toMatchObject({
      audiences: ['volunteer', 'tutor'],
      categoryId: 3,
      languages: ['en'],
      published: true,
      slug: 'hello',
    })
  })

  it('adds the language on publish and removes it on unpublish', () => {
    expect(buildArticlePayload(draft, 'it', true).languages).toEqual(['en', 'it'])
    const none = buildArticlePayload(draft, 'en', false)
    expect(none.languages).toEqual([])
    expect(none.published).toBe(false)
  })

  it('rejects a missing slug or default title', () => {
    expect(() => buildArticlePayload({ ...draft, slug: ' ' }, 'en', null)).toThrow(ArticleSaveError)
    expect(() => buildArticlePayload({ ...draft, titles: { ...draft.titles, en: '' } }, 'en', null)).toThrow(
      ArticleSaveError
    )
  })

  it('rejects publishing a language without title or content', () => {
    expect(() => buildArticlePayload(draft, 'es', true)).toThrow(expect.objectContaining({ code: 'INCOMPLETE' }))
  })
})
