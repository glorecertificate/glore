import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { type PoolClient } from 'pg'
import { parse } from 'yaml'

import { CONTENT_DIR, LOCALES } from './config.mts'

const LEGAL_DIR = join(CONTENT_DIR, 'legal')

const SOURCE_LOCALE = 'en'

export const LEGAL_SLUGS = ['privacy', 'quality-charter', 'terms'] as const

const ACCEPTANCE_SLUGS: readonly string[] = ['terms']

const FRONT_MATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u

export const parseLegalFile = (source: string) => {
  const match = FRONT_MATTER_REGEX.exec(source)
  if (!match) return null
  const meta = parse(match[1] ?? '') as { title?: unknown; updated?: unknown } | null
  if (typeof meta?.title !== 'string' || meta.title.trim() === '') return null
  const { updated } = meta
  const date =
    updated instanceof Date ? updated.toISOString().slice(0, 10) : typeof updated === 'string' ? updated : null
  return { body: (match[2] ?? '').trim(), title: meta.title.trim(), updated: date }
}

export interface LegalFixture {
  effectiveAt: string | null
  slug: string
  translations: { body: string; locale: string; title: string }[]
}

export const readLegalFixtures = (root = LEGAL_DIR): LegalFixture[] =>
  LEGAL_SLUGS.map(slug => {
    const files = LOCALES.map(locale => {
      const parsed = parseLegalFile(readFileSync(join(root, `${slug}.${locale}.md`), 'utf8'))
      if (!parsed) throw new Error(`content/legal/${slug}.${locale}.md has no valid front matter`)
      return { ...parsed, locale }
    })
    return {
      effectiveAt: files.find(({ locale }) => locale === SOURCE_LOCALE)?.updated ?? null,
      slug,
      translations: files.map(({ body, locale, title }) => ({ body, locale, title })),
    }
  })

const hash = (text: string) => createHash('sha256').update(text).digest('hex')

export const seedLegal = async (client: PoolClient, { now, root }: { now: string; root?: string }) => {
  const { rows } = await client.query<{ count: string }>('select count(*) as count from legal_documents')
  if (Number(rows[0]?.count ?? 0) > 0) return false

  for (const fixture of readLegalFixtures(root)) {
    await client.query('insert into legal_documents (slug, requires_acceptance) values ($1, $2)', [
      fixture.slug,
      ACCEPTANCE_SLUGS.includes(fixture.slug),
    ])
    const { rows: versions } = await client.query<{ id: number }>(
      `insert into legal_versions (document_slug, version, status, material, effective_at, published_at)
       values ($1, 1, 'published', false, $2, $3)
       returning id`,
      [fixture.slug, fixture.effectiveAt, now]
    )
    const [{ id }] = versions
    const source = fixture.translations.find(({ locale }) => locale === SOURCE_LOCALE)

    for (const { body, locale, title } of fixture.translations) {
      await client.query(
        `insert into legal_translations (version_id, locale, title, body, status, source_hash)
         values ($1, $2, $3, $4, 'reviewed', $5)`,
        [id, locale, title, body, locale !== SOURCE_LOCALE && source ? hash(source.body) : null]
      )
    }
    await client.query('update legal_documents set current_version_id = $1 where slug = $2', [id, fixture.slug])
  }
  return true
}
