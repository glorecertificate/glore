import { describe, expect, it } from 'vitest'

import { nationalityName } from '@/components/features/certificates/nationality'
import en from '~/messages/en.json'

const codes = Object.keys(en.Intl.Countries).filter(code => code !== 'country')

describe('nationalityName', () => {
  it('prints the demonym in each certificate language', () => {
    expect(nationalityName('GB', 'en')).toBe('British')
    expect(nationalityName('gb', 'es')).toBe('británica')
    expect(nationalityName('it', 'it')).toBe('italiana')
    expect(nationalityName('US', 'it')).toBe('statunitense')
  })

  it.each(['es', 'it'])('has a demonym in %s for every country of the picker', language => {
    const missing = codes.filter(code => {
      const name = nationalityName(code, language) ?? ''
      return name === '' || name[0] !== name[0]?.toLowerCase()
    })
    expect(missing).toEqual([])
  })

  it('falls back to the country name for a code without a demonym', () => {
    expect(nationalityName('XK', 'en')).toBe('Kosovo')
    expect(nationalityName('GB', 'fr')).toBe('Royaume-Uni')
  })

  it('keeps a legacy free text value and an empty value', () => {
    expect(nationalityName('British', 'en')).toBe('British')
    expect(nationalityName(null, 'en')).toBeNull()
  })
})
