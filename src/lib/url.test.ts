import { describe, expect, it } from 'vitest'

import { isHttpUrl, optionalHttpUrl } from '@/lib/url'

const scriptUrl = (scheme = 'javascript') => [scheme, 'alert(1)'].join(':')

describe('isHttpUrl', () => {
  it('accepts web addresses', () => {
    expect(isHttpUrl('https://example.org')).toBe(true)
    expect(isHttpUrl('http://example.org/path?q=1#top')).toBe(true)
    expect(isHttpUrl('HTTPS://EXAMPLE.ORG')).toBe(true)
  })

  it('rejects other schemes and values that are not absolute addresses', () => {
    expect(isHttpUrl(scriptUrl())).toBe(false)
    expect(isHttpUrl(scriptUrl('JaVaScRiPt'))).toBe(false)
    expect(isHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isHttpUrl('vbscript:msgbox(1)')).toBe(false)
    expect(isHttpUrl('ftp://example.org')).toBe(false)
    expect(isHttpUrl('//example.org')).toBe(false)
    expect(isHttpUrl('www.example.org')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
  })
})

describe('optionalHttpUrl', () => {
  const schema = optionalHttpUrl(40)

  it('turns an empty value into null and trims the rest', () => {
    expect(schema.parse('')).toBeNull()
    expect(schema.parse('   ')).toBeNull()
    expect(schema.parse('  https://example.org  ')).toBe('https://example.org')
  })

  it('rejects scripts, other schemes, and values over the limit', () => {
    expect(schema.safeParse(scriptUrl()).success).toBe(false)
    expect(schema.safeParse('ftp://example.org').success).toBe(false)
    expect(schema.safeParse(`https://example.org/${'a'.repeat(40)}`).success).toBe(false)
  })

  it('carries the message of the form that owns the field', () => {
    const result = optionalHttpUrl(40, 'Enter a web address').safeParse('nope')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Enter a web address')
  })
})
