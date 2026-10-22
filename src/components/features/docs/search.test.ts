import { describe, expect, it } from 'vitest'

import { buildDocIndex, searchDocs } from '@/components/features/docs/search'
import { type DocCategory } from '@/db/queries/doc'

const text = (en: string, es = '', ita = '') => ({ en, es, it: ita })

const article = ({
  content,
  id,
  slug,
  title,
  titleEs,
  ...overrides
}: {
  content: string
  id: number
  slug: string
  title: string
  titleEs?: string
  [key: string]: unknown
}) => ({
  categoryId: 1,
  content: text(content),
  createdAt: '2026-01-01',
  excerpt: null,
  id,
  isDraft: false,
  isPublished: true,
  published: true,
  slug,
  title: text(title, titleEs),
  updatedAt: '2026-01-01',
  ...overrides,
})

const categories = [
  {
    articles: [
      article({
        content: 'Open **Settings** and choose [Security](/settings).',
        id: 1,
        slug: 'reset-password',
        title: 'Reset your password',
      }),
      article({
        content: 'Finish three skill courses first.',
        excerpt: text('How certificates work'),
        id: 2,
        slug: 'certificates',
        title: 'Request a certificate',
        titleEs: 'Solicitar un certificado',
      }),
      article({
        content: '# Heading\n\n```js\nconst password = 1\n```\nGloRe speaks English.',
        id: 3,
        slug: 'faq-languages',
        title: 'Languages',
      }),
    ],
    createdAt: '2026-01-01',
    description: null,
    id: 1,
    slug: 'faq',
    title: text('FAQ', 'Preguntas'),
    updatedAt: '2026-01-01',
  },
] as unknown as DocCategory[]

describe('docs search', () => {
  const index = buildDocIndex(categories, 'en')

  it('links every entry to its article page', () => {
    expect(index.map(entry => entry.href)).toEqual([
      '/docs/articles/reset-password',
      '/docs/articles/certificates',
      '/docs/articles/faq-languages',
    ])
  })

  it('ranks title matches above content matches', () => {
    expect(searchDocs(index, 'password').map(result => result.slug)).toEqual(['reset-password'])
    expect(searchDocs(index, 'certificate').map(result => result.slug)).toEqual(['certificates'])
  })

  it('requires every term and ignores case', () => {
    expect(searchDocs(index, 'RESET security').map(result => result.slug)).toEqual(['reset-password'])
    expect(searchDocs(index, 'reset speaks')).toEqual([])
  })

  it('does not search inside code blocks and returns nothing for an empty query', () => {
    expect(searchDocs(index, 'const')).toEqual([])
    expect(searchDocs(index, '   ')).toEqual([])
  })

  it('falls back to English when a translation is missing and caps the results', () => {
    const spanish = buildDocIndex(categories, 'es')
    expect(spanish.map(entry => entry.title)).toEqual(['Reset your password', 'Solicitar un certificado', 'Languages'])
    expect(searchDocs(index, 'a', 1)).toHaveLength(1)
  })
})
