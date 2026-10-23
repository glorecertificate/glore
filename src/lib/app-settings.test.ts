import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SETTINGS,
  SETTING_KEYS,
  changedSettings,
  createSettingsSchema,
  parseSettings,
  settingsInputSchema,
  socialLinks,
} from '@/lib/app-settings'
import metadata from '~/config/metadata.json'

describe('DEFAULT_SETTINGS', () => {
  it('reads every default from config/metadata.json', () => {
    expect(DEFAULT_SETTINGS.email).toBe(metadata.email)
    expect(DEFAULT_SETTINGS.phone).toBe(metadata.phone)
    expect(DEFAULT_SETTINGS.website).toBe(metadata.website)
    expect(DEFAULT_SETTINGS.legalEntity).toEqual(metadata.legalEntity)
    expect(DEFAULT_SETTINGS.social).toEqual(metadata.social)
  })

  it('passes its own validation', () => {
    expect(settingsInputSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true)
  })
})

describe('parseSettings', () => {
  it('returns the defaults without rows', () => {
    expect(parseSettings([])).toEqual(DEFAULT_SETTINGS)
  })

  it('applies a valid stored value over its default', () => {
    const settings = parseSettings([{ key: 'email', value: 'Help@Example.org' }])
    expect(settings.email).toBe('help@example.org')
    expect(settings.phone).toBe(DEFAULT_SETTINGS.phone)
  })

  it('falls back to the default for an invalid value', () => {
    const settings = parseSettings([
      { key: 'email', value: 'not an email' },
      { key: 'website', value: 'ftp://example.org' },
      { key: 'phone', value: 12 },
      { key: 'legalEntity', value: { name: '' } },
    ])
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('ignores unknown keys', () => {
    expect(parseSettings([{ key: 'unknown', value: 'x' }])).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps each key independent', () => {
    const settings = parseSettings([
      { key: 'email', value: 'broken' },
      { key: 'website', value: 'https://example.org' },
    ])
    expect(settings.email).toBe(DEFAULT_SETTINGS.email)
    expect(settings.website).toBe('https://example.org')
  })

  it('accepts empty and filled social links', () => {
    const social = { ...DEFAULT_SETTINGS.social, linkedin: 'https://linkedin.com/company/glore' }
    expect(parseSettings([{ key: 'social', value: social }]).social).toEqual(social)
  })

  it('rejects a social link that is not an http address', () => {
    const social = { ...DEFAULT_SETTINGS.social, x: 'ftp://example.org/glore' }
    expect(parseSettings([{ key: 'social', value: social }]).social).toEqual(DEFAULT_SETTINGS.social)
  })
})

describe('createSettingsSchema', () => {
  const messages = { email: 'bad email', phone: 'bad phone', required: 'needed', url: 'bad url' }

  it('uses the given messages', () => {
    const result = createSettingsSchema(messages).safeParse({
      ...DEFAULT_SETTINGS,
      email: 'nope',
      legalEntity: { address: '', country: 'it', name: 'Joint' },
      phone: '0256568779',
      website: 'nope',
    })
    expect(result.success).toBe(false)
    const issues = result.error?.issues.map(issue => issue.message)
    expect(issues).toEqual(expect.arrayContaining(['bad email', 'bad phone', 'bad url', 'needed']))
  })

  it('trims text values', () => {
    const result = createSettingsSchema(messages).parse({
      ...DEFAULT_SETTINGS,
      legalEntity: { address: '  Via Roma 1  ', country: ' IT ', name: ' Joint ' },
    })
    expect(result.legalEntity).toEqual({ address: 'Via Roma 1', country: 'it', name: 'Joint' })
  })
})

describe('changedSettings', () => {
  it('lists nothing for equal settings', () => {
    expect(changedSettings(DEFAULT_SETTINGS, { ...DEFAULT_SETTINGS })).toEqual([])
  })

  it('lists the keys that differ, in key order', () => {
    const next = { ...DEFAULT_SETTINGS, email: 'other@example.org', website: 'https://example.org' }
    expect(changedSettings(DEFAULT_SETTINGS, next)).toEqual(['email', 'website'])
  })

  it('detects a nested change', () => {
    const next = { ...DEFAULT_SETTINGS, legalEntity: { ...DEFAULT_SETTINGS.legalEntity, name: 'Joint ETS' } }
    expect(changedSettings(DEFAULT_SETTINGS, next)).toEqual(['legalEntity'])
  })

  it('only knows the declared keys', () => {
    expect(SETTING_KEYS).toEqual(['email', 'phone', 'website', 'social', 'legalEntity'])
  })
})

describe('socialLinks', () => {
  it('skips empty links and keeps the platform order', () => {
    const links = socialLinks({
      social: {
        facebook: '',
        instagram: 'https://instagram.com/glore',
        linkedin: '',
        x: '',
        youtube: 'https://youtube.com/@glore',
      },
    })
    expect(links).toEqual([
      { href: 'https://instagram.com/glore', platform: 'instagram' },
      { href: 'https://youtube.com/@glore', platform: 'youtube' },
    ])
  })
})
