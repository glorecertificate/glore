import { describe, expect, it } from 'vitest'

import { safeNextPath } from '@/lib/next-path'

describe('safeNextPath', () => {
  it('keeps a same-site path with its query', () => {
    expect(safeNextPath('/certificates/16911/review')).toBe('/certificates/16911/review')
    expect(safeNextPath('/courses?level=2&q=a%20b')).toBe('/courses?level=2&q=a%20b')
    expect(safeNextPath('/invite/abc123')).toBe('/invite/abc123')
  })

  it('answers null for a missing or empty value', () => {
    expect(safeNextPath(null)).toBeNull()
    expect(safeNextPath(undefined)).toBeNull()
    expect(safeNextPath('')).toBeNull()
  })

  it('refuses another site and every spelling that browsers read as one', () => {
    for (const value of [
      'https://evil.example',
      'http://evil.example/dashboard',
      '//evil.example',
      '///evil.example',
      '/\\evil.example',
      '\\\\evil.example',
      '/\\/evil.example',
      '/foo/..//evil.example',
      '/\t/evil.example',
      '/\n/evil.example',
      '/\r/evil.example',
      ['java', 'script:alert(1)'].join(''),
      'dashboard',
      ' /dashboard',
      'mailto:a@b.example',
    ]) {
      expect(safeNextPath(value)).toBeNull()
    }
  })

  it('refuses the sign-in pages and the API, in any spelling', () => {
    for (const value of [
      '/login',
      '/login?next=/dashboard',
      '/login/',
      '/LOGIN',
      '/register',
      '/%6cogin',
      '/foo/../login',
      '/api',
      '/api/auth/sign-out',
      '/api/v1/session',
      '/%61pi/v1/session',
      '/api%2Fv1/session',
    ]) {
      expect(safeNextPath(value)).toBeNull()
    }
  })

  it('refuses a malformed escape and an absurdly long value', () => {
    expect(safeNextPath('/%E0%A4%A')).toBeNull()
    expect(safeNextPath(`/${'a'.repeat(3000)}`)).toBeNull()
  })

  it('normalizes dot segments instead of passing them on', () => {
    expect(safeNextPath('/courses/../certificates')).toBe('/certificates')
  })
})
