import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { loadLegalDocument, parseLegalFile } from '@/lib/legal'

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
    expect(parseLegalFile('---\ntitle: Terms\nupdated: 2026-10-22\n---\nBody')).toEqual({
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

describe('loadLegalDocument', () => {
  let root = ''

  beforeAll(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'legal-'))
    await writeFile(path.join(root, 'privacy.en.md'), FILE)
    await writeFile(path.join(root, 'privacy.it.md'), FILE.replace('Privacy Policy', 'Informativa'))
    await writeFile(path.join(root, 'terms.en.md'), FILE.replace('Privacy Policy', 'Terms'))
  })

  afterAll(async () => {
    await rm(root, { force: true, recursive: true })
  })

  it('loads the file for the active locale', async () => {
    const content = await loadLegalDocument('privacy', 'it', root)
    expect(content).toMatchObject({ locale: 'it', title: 'Informativa' })
  })

  it('falls back to English when the locale has no file', async () => {
    const content = await loadLegalDocument('terms', 'es', root)
    expect(content).toMatchObject({ locale: 'en', title: 'Terms' })
  })

  it('returns null when nothing exists', async () => {
    expect(await loadLegalDocument('quality-charter', 'en', root)).toBeNull()
  })
})
