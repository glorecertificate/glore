import { describe, expect, it } from 'vitest'

import { docArticleUpdateSchema, docCategoryInsertSchema } from '@/db/schemas'

const title = { en: 'Title', es: 'Titulo', it: 'Titolo' }

describe('docCategoryInsertSchema', () => {
  it('accepts a full locale record', () => {
    expect(docCategoryInsertSchema.safeParse({ slug: 'faq', title }).success).toBe(true)
  })

  it('rejects unknown locale keys', () => {
    expect(docCategoryInsertSchema.safeParse({ slug: 'faq', title: { ...title, fr: 'Titre' } }).success).toBe(false)
  })

  it('rejects an empty slug', () => {
    expect(docCategoryInsertSchema.safeParse({ slug: '', title }).success).toBe(false)
  })
})

describe('docArticleUpdateSchema', () => {
  it('strips client-provided timestamps', () => {
    const parsed = docArticleUpdateSchema.parse({ createdAt: '2020-01-01', published: true })
    expect(parsed).toEqual({ published: true })
  })
})
