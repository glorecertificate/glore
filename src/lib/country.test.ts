import { describe, expect, it } from 'vitest'

import { countryName } from '@/lib/country'

const names = { it: 'Italy', pt: 'Portugal' }

describe('countryName', () => {
  it('resolves lower-case codes', () => {
    expect(countryName(names, 'pt')).toBe('Portugal')
  })

  it('resolves upper-case and mixed-case codes', () => {
    expect(countryName(names, 'PT')).toBe('Portugal')
    expect(countryName(names, 'It')).toBe('Italy')
  })

  it('falls back to the upper-cased code for unknown countries', () => {
    expect(countryName(names, 'zz')).toBe('ZZ')
  })

  it('ignores inherited object keys', () => {
    expect(countryName(names, 'constructor')).toBe('CONSTRUCTOR')
  })
})
