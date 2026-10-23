import { describe, expect, it } from 'vitest'

import { loadMessages, resolveLocale } from '@/lib/messages'
import en from '~/messages/en.json'
import es from '~/messages/es.json'

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
  it('loads the catalog of the locale', async () => {
    expect(await loadMessages('es')).toEqual(es)
  })

  it('loads the default catalog for an unknown locale', async () => {
    expect(await loadMessages('xx')).toEqual(en)
  })
})
