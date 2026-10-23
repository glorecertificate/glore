import { describe, expect, it } from 'vitest'

import { type ImportOptions, guardExistingContent, guardTarget, parseImportArgs } from './target.mts'

const LOCAL_URL = 'postgres://glore:glore@localhost:5433/glore'
const REMOTE_URL = 'postgres://user:secret@ep-example.eu-central-1.aws.neon.tech/neondb'

const options = (overrides: Partial<ImportOptions>): ImportOptions => ({
  bootstrap: false,
  drafts: false,
  dryRun: false,
  examples: false,
  remove: [],
  target: 'local',
  ...overrides,
})

describe('parseImportArgs', () => {
  it('requires an explicit target', () => {
    expect(parseImportArgs([]).error).toMatch(/--target/u)
    expect(parseImportArgs(['--target', 'prod']).error).toMatch(/--target/u)
  })

  it('parses flags', () => {
    expect(
      parseImportArgs(['--target', 'staging', '--drafts', '--examples', '--dry-run', '--remove', 'a', '--remove', 'b'])
        .options
    ).toEqual(options({ drafts: true, dryRun: true, examples: true, remove: ['a', 'b'], target: 'staging' }))
  })

  it('rejects unknown flags', () => {
    expect(parseImportArgs(['--target', 'local', '--force']).error).toMatch(/force/u)
  })
})

describe('guardTarget', () => {
  it('requires a database url', () => {
    expect(guardTarget(options({}), undefined).error).toMatch(/DATABASE_URL/u)
  })

  it('keeps local imports on localhost', () => {
    expect(guardTarget(options({}), LOCAL_URL)).toEqual({ drafts: false })
    expect(guardTarget(options({}), REMOTE_URL).error).toMatch(/localhost/u)
  })

  it('keeps remote imports off localhost', () => {
    expect(guardTarget(options({ target: 'staging' }), REMOTE_URL)).toEqual({ drafts: false })
    expect(guardTarget(options({ target: 'staging' }), LOCAL_URL).error).toMatch(/not local/u)
    expect(guardTarget(options({ target: 'production' }), LOCAL_URL).error).toMatch(/not local/u)
  })

  it('forces drafts on production', () => {
    expect(guardTarget(options({ target: 'production' }), REMOTE_URL)).toEqual({ drafts: true })
  })

  it('refuses examples and removals on production', () => {
    expect(guardTarget(options({ examples: true, target: 'production' }), REMOTE_URL).error).toMatch(/example/u)
    expect(guardTarget(options({ remove: ['a'], target: 'production' }), REMOTE_URL).error).toMatch(/remove/u)
  })
})

describe('guardExistingContent', () => {
  it('locks production once content exists', () => {
    expect(guardExistingContent(options({ target: 'production' }), 0)).toBeUndefined()
    expect(guardExistingContent(options({ target: 'production' }), 65)).toMatch(/--bootstrap/u)
    expect(guardExistingContent(options({ bootstrap: true, target: 'production' }), 65)).toBeUndefined()
    expect(guardExistingContent(options({ target: 'staging' }), 65)).toBeUndefined()
  })

  it('accepts --bootstrap only on production', () => {
    expect(parseImportArgs(['--target', 'production', '--bootstrap']).options?.bootstrap).toBe(true)
    expect(guardTarget(options({ bootstrap: true, target: 'production' }), REMOTE_URL)).toEqual({ drafts: true })
    expect(guardTarget(options({ bootstrap: true, target: 'staging' }), REMOTE_URL).error).toMatch(/production/u)
  })
})
