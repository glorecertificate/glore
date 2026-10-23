import { describe, expect, it, vi } from 'vitest'

import { LOCALES } from './config.mts'
import { LEGAL_SLUGS, parseLegalFile, readLegalFixtures, seedLegal } from './legal.mts'

const FILE = `---
title: 'Privacy Policy'
updated: '2026-10-22'
---

Intro text.

## Section

- one
- two
`

describe('parseLegalFile', () => {
  it('splits the front matter from the body', () => {
    expect(parseLegalFile(FILE)).toEqual({
      body: 'Intro text.\n\n## Section\n\n- one\n- two',
      title: 'Privacy Policy',
      updated: '2026-10-22',
    })
  })

  it('reads an unquoted date', () => {
    expect(parseLegalFile('---\ntitle: Terms\nupdated: 2026-10-22\n---\nBody')).toMatchObject({
      body: 'Body',
      title: 'Terms',
      updated: '2026-10-22',
    })
  })

  it('rejects files without a title or front matter', () => {
    expect(parseLegalFile('Just text')).toBeNull()
    expect(parseLegalFile('---\nupdated: 2026-10-22\n---\nBody')).toBeNull()
  })
})

describe('readLegalFixtures', () => {
  it('reads every document in every locale from content/legal', () => {
    const fixtures = readLegalFixtures()
    expect(fixtures.map(({ slug }) => slug)).toEqual([...LEGAL_SLUGS])
    for (const fixture of fixtures) {
      expect(fixture.effectiveAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u)
      expect(fixture.translations.map(({ locale }) => locale)).toEqual(LOCALES)
    }
  })
})

describe('seedLegal', () => {
  const clientWith = (count: number) => {
    const query = vi.fn((sql: string, _values?: unknown[]) => {
      if (sql.includes('count(*)')) return Promise.resolve({ rows: [{ count: String(count) }] })
      if (sql.includes('insert into legal_versions')) return Promise.resolve({ rows: [{ id: 10 }] })
      return Promise.resolve({ rows: [] })
    })
    return { client: { query } as never, query }
  }

  it('leaves a database that already has legal documents untouched', async () => {
    const { client, query } = clientWith(3)
    expect(await seedLegal(client, { now: '2026-10-23T00:00:00.000Z' })).toBe(false)
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('seeds version 1 of every document on a fresh database', async () => {
    const { client, query } = clientWith(0)
    expect(await seedLegal(client, { now: '2026-10-23T00:00:00.000Z' })).toBe(true)
    const statements = query.mock.calls.map(([sql]) => sql)
    expect(statements.filter(sql => sql.includes('insert into legal_documents'))).toHaveLength(3)
    expect(statements.filter(sql => sql.includes('insert into legal_translations'))).toHaveLength(3 * LOCALES.length)
    expect(statements.filter(sql => sql.includes('update legal_documents'))).toHaveLength(3)
    const terms = query.mock.calls.find(
      ([sql, values]) => sql.includes('insert into legal_documents') && values?.[0] === 'terms'
    )
    expect(terms?.[1]).toEqual(['terms', true])
  })
})
