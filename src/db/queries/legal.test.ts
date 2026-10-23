import { describe, expect, it } from 'vitest'

import {
  headingMismatches,
  headingShape,
  isKnownLegalErrorCode,
  isLegalDocument,
  legalPublishInputSchema,
  legalTranslationInputSchema,
  pendingAcceptance,
} from '@/db/queries/legal'

describe('headingShape', () => {
  it('lists the heading levels in order and ignores other lines', () => {
    expect(headingShape('Intro\n\n## One\n\ntext # not a heading\n\n### Two\n\n## Three')).toBe('232')
    expect(headingShape('No headings')).toBe('')
  })
})

describe('headingMismatches', () => {
  const source = '## One\n\n## Two'

  it('accepts translations with the same headings as English', () => {
    expect(
      headingMismatches([
        { body: source, locale: 'en' },
        { body: '## Uno\n\n## Dos', locale: 'es' },
        { body: '## Uno\n\ntesto\n\n## Due', locale: 'it' },
      ])
    ).toEqual([])
  })

  it('names the locales whose headings differ', () => {
    expect(
      headingMismatches([
        { body: source, locale: 'en' },
        { body: '## Uno', locale: 'es' },
        { body: '## Uno\n\n### Due', locale: 'it' },
      ])
    ).toEqual(['es', 'it'])
  })

  it('has nothing to compare without the source text', () => {
    expect(headingMismatches([{ body: '## Uno', locale: 'es' }])).toEqual([])
  })
})

describe('pendingAcceptance', () => {
  const terms = { currentVersion: 3, currentVersionId: 30, materialVersion: 2, slug: 'terms' as const }

  it('asks nobody when no material version exists', () => {
    expect(pendingAcceptance([{ ...terms, materialVersion: null }], [])).toBeNull()
  })

  it('asks for the current version when the material version is not accepted', () => {
    expect(pendingAcceptance([terms], [{ slug: 'terms', version: 1 }])).toEqual({
      slug: 'terms',
      version: 3,
      versionId: 30,
    })
    expect(pendingAcceptance([terms], [])).toMatchObject({ versionId: 30 })
  })

  it('accepts the material version or any later one', () => {
    expect(pendingAcceptance([terms], [{ slug: 'terms', version: 2 }])).toBeNull()
    expect(pendingAcceptance([terms], [{ slug: 'terms', version: 3 }])).toBeNull()
  })

  it('does not count acceptances of another document', () => {
    expect(pendingAcceptance([terms], [{ slug: 'privacy', version: 5 }])).not.toBeNull()
  })

  it('skips a document without a current version', () => {
    expect(pendingAcceptance([{ ...terms, currentVersion: null, currentVersionId: null }], [])).toBeNull()
  })
})

describe('legal inputs', () => {
  it('knows the documents and error codes', () => {
    expect(isLegalDocument('terms')).toBe(true)
    expect(isLegalDocument('cookies')).toBe(false)
    expect(isKnownLegalErrorCode('HEADINGS_DIFFER')).toBe(true)
    expect(isKnownLegalErrorCode('NOPE')).toBe(false)
  })

  it('validates a translation', () => {
    const valid = { body: 'Text', locale: 'it', title: 'Titolo', versionId: 4 }
    expect(legalTranslationInputSchema.safeParse(valid).success).toBe(true)
    expect(legalTranslationInputSchema.safeParse({ ...valid, locale: 'fr' }).success).toBe(false)
    expect(legalTranslationInputSchema.safeParse({ ...valid, title: ' ' }).success).toBe(false)
  })

  it('validates a publication and trims the note', () => {
    const parsed = legalPublishInputSchema.parse({
      changeNote: '  Clearer wording  ',
      effectiveAt: '2026-11-01',
      material: true,
      versionId: 4,
    })
    expect(parsed.changeNote).toBe('Clearer wording')
    expect(legalPublishInputSchema.safeParse({ effectiveAt: 'soon', material: false, versionId: 4 }).success).toBe(
      false
    )
    expect(
      legalPublishInputSchema.parse({ effectiveAt: '2026-11-01', material: false, versionId: 4 }).changeNote
    ).toBeNull()
  })
})
