import { describe, expect, it } from 'vitest'

import { countSql, normalizePrefix, parseRehostArgs, updateSql } from './plan.mts'

const OLD = 'https://pub-0123456789abcdef.r2.dev'
const NEW = 'https://cdn.glorecertificate.xyz'

describe('normalizePrefix', () => {
  it('removes trailing slashes and keeps the path', () => {
    expect(normalizePrefix(`${NEW}/`)).toBe(NEW)
    expect(normalizePrefix('http://localhost:9000/glore-e2e//')).toBe('http://localhost:9000/glore-e2e')
  })

  it('refuses values that would break a JSON or array literal', () => {
    expect(normalizePrefix(`${NEW}/a"b`)).toBeNull()
    expect(normalizePrefix(`${NEW}/a,b`)).toBeNull()
    expect(normalizePrefix(`${NEW}/a b`)).toBeNull()
  })

  it('refuses other protocols, queries, hashes, and credentials', () => {
    expect(normalizePrefix('ftp://files.example.com')).toBeNull()
    expect(normalizePrefix(`${NEW}?v=1`)).toBeNull()
    expect(normalizePrefix(`${NEW}#top`)).toBeNull()
    expect(normalizePrefix('https://user:secret@files.example.com')).toBeNull()
    expect(normalizePrefix(undefined)).toBeNull()
  })
})

describe('parseRehostArgs', () => {
  it('reads a dry run by default and --apply when given', () => {
    expect(parseRehostArgs(['--from', OLD, '--to', `${NEW}/`])).toEqual({
      options: { apply: false, from: OLD, to: NEW },
    })
    expect(parseRehostArgs(['--from', OLD, '--to', NEW, '--apply']).options?.apply).toBe(true)
  })

  it('refuses a missing, equal, or nested target', () => {
    expect(parseRehostArgs(['--from', OLD]).error).toMatch(/--from and --to/u)
    expect(parseRehostArgs(['--from', OLD, '--to', `${OLD}/`]).error).toBe('--from and --to must differ')
    expect(parseRehostArgs(['--from', OLD, '--to', `${OLD}/files`]).error).toBe('--to must not be a path under --from')
    expect(parseRehostArgs(['--from', OLD, '--to', `${OLD}-next`]).options?.to).toBe(`${OLD}-next`)
  })

  it('refuses unknown flags', () => {
    expect(parseRehostArgs(['--from', OLD, '--to', NEW, '--force']).error).toMatch(/force/u)
  })
})

describe('rehost statements', () => {
  const column = { column: 'avatar"url', table: 'organizations', type: 'jsonb' }

  it('quotes identifiers and matches the prefix as a parameter', () => {
    expect(countSql(column)).toBe(
      'select count(*)::int as "count" from "organizations" where strpos("avatar""url"::text, $1) > 0'
    )
  })

  it('casts the replaced text back to the base column type', () => {
    expect(updateSql({ ...column, type: 'character varying' })).toBe(
      'update "organizations" set "avatar""url" = replace("avatar""url"::text, $1, $2)::character varying where strpos("avatar""url"::text, $1) > 0'
    )
    expect(updateSql({ ...column, type: 'text[]' })).toContain('::text[] where')
  })
})
