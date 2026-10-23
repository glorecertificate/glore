import { beforeEach, describe, expect, it, vi } from 'vitest'

import { flattenMessages } from '@/lib/message-overrides'
import { loadMessages, loadRawMessages, resolveLocale, usesPrecompiledMessages } from '@/lib/messages'
import en from '~/messages/en.json'
import es from '~/messages/es.json'

const state = vi.hoisted(() => ({
  failure: null as Error | null,
  rows: [] as { key: string; locale: string; value: string | null }[],
}))

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => (state.failure ? Promise.reject(state.failure) : Promise.resolve(state.rows)),
      }),
    }),
  },
}))

const lookup = (messages: unknown, key: string) =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages)

const argumentKey = Object.entries(flattenMessages(es)).find(([, value]) => /^[^{}<>']*\{\w+\}[^{}<>']*$/u.test(value))

describe('resolveLocale', () => {
  it('keeps a supported locale', () => {
    expect(resolveLocale('it')).toBe('it')
  })

  it('falls back to the default locale', () => {
    expect(resolveLocale('xx')).toBe('en')
    expect(resolveLocale(null)).toBe('en')
  })
})

describe('loadMessages', () => {
  beforeEach(() => {
    state.failure = null
    state.rows = []
  })

  it('loads the catalog of the locale', async () => {
    expect(await loadMessages('es')).toEqual(es)
  })

  it('loads the default catalog for an unknown locale', async () => {
    expect(await loadMessages('xx')).toEqual(en)
  })

  it('applies a published override that keeps the placeholders', async () => {
    const [key, value] = argumentKey as [string, string]
    state.rows = [{ key, locale: 'es', value: `[edited] ${value}` }]
    const messages = await loadMessages('es')
    expect(lookup(messages, key)).toBe(`[edited] ${value}`)
    expect(lookup(await loadMessages('en'), key)).toBe(lookup(en, key))
    expect(lookup(es, key)).toBe(value)
  })

  it('ignores an override that drops a placeholder', async () => {
    const [key, value] = argumentKey as [string, string]
    state.rows = [{ key, locale: 'es', value: value.replaceAll(/\{\w+\}/gu, 'x') }]
    expect(lookup(await loadMessages('es'), key)).toBe(value)
  })

  it('ignores an override for a removed key', async () => {
    state.rows = [{ key: 'Common.removedKey', locale: 'es', value: 'x' }]
    expect(await loadMessages('es')).toEqual(es)
  })

  it('serves the bundled catalog when the overrides cannot load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    state.failure = new Error('offline')
    expect(await loadMessages('es')).toEqual(es)
  })
})

describe('raw catalogs', () => {
  it('reads the bundled text of a locale', async () => {
    const raw = await loadRawMessages('es')
    const [key, value] = argumentKey as [string, string]
    expect(raw[key]).toBe(value)
  })

  it('reports an unprecompiled catalog outside a build', async () => {
    expect(await usesPrecompiledMessages()).toBe(false)
  })
})
