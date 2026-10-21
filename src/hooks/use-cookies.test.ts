import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCookies } from '@/hooks/use-cookies'

const writes: string[] = []
const jar = new Map<string, string>()

const fakeDocument = {
  get cookie() {
    return [...jar].map(([key, value]) => `${key}=${value}`).join('; ')
  },
  set cookie(input: string) {
    writes.push(input)
    const [pair, ...attributes] = input.split('; ')
    if (attributes.some(attribute => attribute.toLowerCase().startsWith('httponly'))) return
    const index = pair.indexOf('=')
    jar.set(pair.slice(0, index), pair.slice(index + 1))
  },
}

describe('useCookies', () => {
  beforeEach(() => {
    writes.length = 0
    jar.clear()
    vi.stubGlobal('document', fakeDocument)
  })

  it('writes cookies that client scripts can store', () => {
    useCookies().set('courseListParams', 'tab=draft&sort=name')
    expect(writes[0]).not.toMatch(/httponly/iu)
    expect(useCookies().get('courseListParams')).toBe('tab=draft&sort=name')
  })

  it('round-trips JSON values with reserved characters', () => {
    useCookies().set('courseListLanguages', { 1: 'en', 2: 'it' })
    expect(useCookies().get('courseListLanguages')).toEqual({ 1: 'en', 2: 'it' })
  })
})
