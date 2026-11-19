import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { isListedArticle, listedCategories } from '@/components/features/docs/visibility'
import { DOC_AUDIENCES, type DocAudience, type DocCategory } from '@/db/queries/doc'

const DOCS_DIR = join(process.cwd(), 'content', 'docs')

const contentDocs = readdirSync(DOCS_DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .flatMap(category =>
    readdirSync(join(DOCS_DIR, category.name)).map(dir => {
      const meta = JSON.parse(readFileSync(join(DOCS_DIR, category.name, dir, 'doc.json'), 'utf8')) as {
        audiences?: string[]
        slug: string
      }
      return { audiences: meta.audiences ?? [], category: category.name, slug: meta.slug }
    })
  )

const visibleSlugs = (role: DocAudience, category?: string) =>
  contentDocs
    .filter(doc => (category ? doc.category === category : true))
    .filter(doc => isListedArticle(doc, role))
    .map(doc => doc.slug)
    .toSorted()

describe('isListedArticle', () => {
  it('shows an article without audiences to every role', () => {
    for (const role of DOC_AUDIENCES) expect(isListedArticle({ audiences: [] }, role)).toBe(true)
  })

  it('shows a tagged article only to its roles', () => {
    expect(isListedArticle({ audiences: ['tutor'] }, 'tutor')).toBe(true)
    expect(isListedArticle({ audiences: ['tutor'] }, 'volunteer')).toBe(false)
    expect(isListedArticle({ audiences: ['volunteer', 'manager'] }, 'manager')).toBe(true)
    expect(isListedArticle({ audiences: ['volunteer', 'manager'] }, 'learner')).toBe(false)
  })

  it('shows every article to the team', () => {
    expect(isListedArticle({ audiences: ['learner'] }, 'team')).toBe(true)
    expect(isListedArticle({ audiences: ['learner'] }, 'tutor')).toBe(false)
  })
})

describe('listedCategories', () => {
  it('filters the articles and keeps the category', () => {
    const categories = [
      {
        articles: [
          { audiences: [], slug: 'shared' },
          { audiences: ['tutor'], slug: 'tutor-only' },
        ],
        id: 1,
        slug: 'faq',
      },
    ] as unknown as DocCategory[]
    const [learner] = listedCategories(categories, 'learner')
    const [tutor] = listedCategories(categories, 'tutor')
    expect(learner).toMatchObject({ id: 1, slug: 'faq' })
    expect(learner?.articles.map(article => article.slug)).toEqual(['shared'])
    expect(tutor?.articles.map(article => article.slug)).toEqual(['shared', 'tutor-only'])
  })
})

describe('documentation content', () => {
  it('lists only the tutorials for each role', () => {
    expect(visibleSlugs('volunteer', 'tutorials')).toEqual(['tutorial-volunteer'])
    expect(visibleSlugs('learner', 'tutorials')).toEqual(['tutorial-learner'])
    expect(visibleSlugs('tutor', 'tutorials')).toEqual(['tutorial-tutor'])
    expect(visibleSlugs('manager', 'tutorials')).toEqual([
      'tutorial-organization-owner',
      'tutorial-organization-representative',
    ])
    expect(visibleSlugs('team', 'tutorials')).toHaveLength(7)
  })

  it('keeps certificate articles away from learners', () => {
    const learner = visibleSlugs('learner')
    const volunteer = visibleSlugs('volunteer')
    expect(learner).toContain('faq-learner-certificate')
    expect(learner).not.toContain('faq-skills-per-certificate')
    expect(learner).not.toContain('how-certification-works')
    expect(volunteer).toContain('faq-skills-per-certificate')
    expect(volunteer).not.toContain('faq-learner-certificate')
  })

  it('shows the general articles to everyone', () => {
    for (const role of DOC_AUDIENCES) {
      expect(visibleSlugs(role)).toEqual(expect.arrayContaining(['faq-help', 'getting-started', 'what-is-glore']))
    }
    expect(visibleSlugs('team')).toHaveLength(contentDocs.length)
  })
})
