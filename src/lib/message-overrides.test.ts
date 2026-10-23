import { describe, expect, it } from 'vitest'

import {
  acceptOverrides,
  applyOverrides,
  classifyOverride,
  flattenMessages,
  hashMessage,
  isPrecompiled,
  mergeMessages,
} from '@/lib/message-overrides'
import { isProtectedKey, namespaceOf, validateOverride } from '@/lib/message-validation'

const en = {
  'Common.greeting': 'Hello {name}',
  'Common.plain': 'Plain text',
  'Common.rich': 'Read <link>more</link>',
  'Email.auth/invite.subject': 'You are invited',
}

describe('keys', () => {
  it('reads the namespace of a key', () => {
    expect(namespaceOf('Common.greeting')).toBe('Common')
  })

  it('protects the legal, certificate, and metadata namespaces', () => {
    expect(isProtectedKey('CertificatePdf.title')).toBe(true)
    expect(isProtectedKey('CertificatePublic.heading.title')).toBe(true)
    expect(isProtectedKey('Legal.title')).toBe(true)
    expect(isProtectedKey('Metadata.title')).toBe(true)
    expect(isProtectedKey('Common.greeting')).toBe(false)
  })

  it('protects email subjects only', () => {
    expect(isProtectedKey('Email.auth/invite.subject')).toBe(true)
    expect(isProtectedKey('Email.certificate/review.subjectApproved')).toBe(true)
    expect(isProtectedKey('Email.certificate/assigned.subject_submitted')).toBe(true)
    expect(isProtectedKey('Email.auth/invite.heading')).toBe(false)
  })
})

describe('catalog helpers', () => {
  it('flattens nested messages to dotted keys', () => {
    expect(flattenMessages({ A: { b: 'x', c: { d: 'y' } }, E: 'z' })).toEqual({ 'A.b': 'x', 'A.c.d': 'y', E: 'z' })
  })

  it('merges a locale over a fallback and keeps untouched branches', () => {
    expect(mergeMessages({ A: { b: 'en', c: 'en' }, D: 'en' }, { A: { b: 'es' } })).toEqual({
      A: { b: 'es', c: 'en' },
      D: 'en',
    })
  })

  it('detects precompiled catalogs from any array node', () => {
    expect(isPrecompiled({ A: { b: 'plain' } })).toBe(false)
    expect(isPrecompiled({ A: { b: ['name'] } })).toBe(true)
  })

  it('hashes equal text equally', () => {
    expect(hashMessage('a')).toBe(hashMessage('a'))
    expect(hashMessage('a')).not.toBe(hashMessage('b'))
  })

  it('applies overrides without mutating the source tree', () => {
    const tree = { A: { b: 'x', c: 'y' } }
    const next = applyOverrides(tree, [{ key: 'A.b', value: 'z' }])
    expect(next).toEqual({ A: { b: 'z', c: 'y' } })
    expect(tree.A.b).toBe('x')
  })
})

describe('validateOverride', () => {
  it('accepts text with the same placeholders', () => {
    expect(validateOverride({ en, key: 'Common.greeting', precompiled: false, value: 'Ciao {name}' })).toEqual({
      ok: true,
      value: 'Ciao {name}',
    })
  })

  it('rejects unknown keys as orphaned', () => {
    expect(validateOverride({ en, key: 'Common.gone', precompiled: false, value: 'x' })).toEqual({
      ok: false,
      reason: 'orphaned',
    })
  })

  it('rejects changed arguments and tags as incompatible', () => {
    expect(validateOverride({ en, key: 'Common.greeting', precompiled: false, value: 'Hello' })).toMatchObject({
      reason: 'incompatible',
    })
    expect(validateOverride({ en, key: 'Common.greeting', precompiled: false, value: 'Hi {user}' })).toMatchObject({
      reason: 'incompatible',
    })
    expect(validateOverride({ en, key: 'Common.rich', precompiled: false, value: 'Read more' })).toMatchObject({
      reason: 'incompatible',
    })
  })

  it('rejects broken ICU as invalid', () => {
    expect(validateOverride({ en, key: 'Common.greeting', precompiled: false, value: 'Hi {name' })).toMatchObject({
      reason: 'invalid',
    })
  })

  it('compiles the text when messages are precompiled', () => {
    expect(validateOverride({ en, key: 'Common.greeting', precompiled: true, value: 'Ciao {name}' })).toEqual({
      ok: true,
      value: ['Ciao ', ['name']],
    })
    expect(validateOverride({ en, key: 'Common.plain', precompiled: true, value: 'Solo testo' })).toEqual({
      ok: true,
      value: 'Solo testo',
    })
  })
})

describe('acceptOverrides', () => {
  const rows = [
    { key: 'Common.greeting', locale: 'es', value: 'Hola {name}' },
    { key: 'Common.greeting', locale: 'en', value: 'Hey {name}' },
    { key: 'Common.plain', locale: 'en', value: 'Plain override' },
    { key: 'Common.rich', locale: 'es', value: 'Leer mas' },
    { key: 'Common.gone', locale: 'es', value: 'Adios' },
    { key: 'Common.plain', locale: 'es', value: null },
  ]

  it('keeps valid published overrides of the locale and drops the rest', () => {
    const accepted = acceptOverrides({ en, locale: 'es', precompiled: false, rows, sourceLocale: 'en' })
    expect(accepted).toEqual([{ key: 'Common.greeting', value: 'Hola {name}' }])
  })

  it('applies the source locale to keys the locale lacks, under its own overrides', () => {
    const accepted = acceptOverrides({
      en,
      gaps: new Set(['Common.greeting', 'Common.plain']),
      locale: 'es',
      precompiled: false,
      rows,
      sourceLocale: 'en',
    })
    expect(accepted).toEqual([
      { key: 'Common.greeting', value: 'Hola {name}' },
      { key: 'Common.plain', value: 'Plain override' },
    ])
  })

  it('applies overrides of the default locale to itself', () => {
    expect(acceptOverrides({ en, locale: 'en', precompiled: false, rows, sourceLocale: 'en' })).toEqual([
      { key: 'Common.greeting', value: 'Hey {name}' },
      { key: 'Common.plain', value: 'Plain override' },
    ])
  })
})

describe('classifyOverride', () => {
  const bundled = { 'Common.greeting': 'Hola {name}' }
  const current = hashMessage(en['Common.greeting'])
  const base = (overrides: Partial<Parameters<typeof classifyOverride>[0]['override']> = {}) => ({
    baseHash: hashMessage(bundled['Common.greeting']),
    draftValue: null,
    key: 'Common.greeting',
    locale: 'es',
    sourceHash: current,
    value: 'Buenas {name}',
    ...overrides,
  })

  it('returns null for a current override', () => {
    expect(classifyOverride({ bundled, en, locale: 'es', override: base() })).toBeNull()
  })

  it('flags a removed key as orphaned', () => {
    expect(classifyOverride({ bundled, en, locale: 'es', override: base({ key: 'Common.gone' }) })).toBe('orphaned')
  })

  it('flags changed arguments as incompatible', () => {
    expect(classifyOverride({ bundled, en, locale: 'es', override: base({ value: 'Buenas' }) })).toBe('incompatible')
  })

  it('flags a changed source as outdated', () => {
    expect(classifyOverride({ bundled, en, locale: 'es', override: base({ sourceHash: 'old' }) })).toBe('outdated')
  })

  it('flags a changed bundled translation as outdated', () => {
    expect(classifyOverride({ bundled, en, locale: 'es', override: base({ baseHash: 'old' }) })).toBe('outdated')
  })

  it('flags text equal to the bundle as redundant', () => {
    expect(classifyOverride({ bundled, en, locale: 'es', override: base({ value: 'Hola {name}' }) })).toBe('redundant')
    expect(
      classifyOverride({ bundled, en, locale: 'en', override: base({ locale: 'en', value: 'Hello {name}' }) })
    ).toBe('redundant')
  })

  it('classifies a draft-only row by its draft', () => {
    expect(classifyOverride({ bundled, en, locale: 'es', override: base({ draftValue: 'Hola', value: null }) })).toBe(
      'incompatible'
    )
  })
})
