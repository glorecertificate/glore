import { describe, expect, it } from 'vitest'

import { authMetaTitleKey, defaultAuthView } from '@/components/features/auth/meta'

describe('defaultAuthView', () => {
  it('opens the login view without params', () => {
    expect(defaultAuthView({ error: null, token: null })).toBe('login')
  })

  it('opens the password reset view with a token', () => {
    expect(defaultAuthView({ error: null, token: 'x' })).toBe('password_reset')
  })

  it('opens the invalid token view on an invalid token error', () => {
    expect(defaultAuthView({ error: 'INVALID_TOKEN', token: 'x' })).toBe('invalid_token')
  })
})

describe('authMetaTitleKey', () => {
  it('uses the meta title key of the view', () => {
    expect(authMetaTitleKey('login')).toBe('loginMetaTitle')
    expect(authMetaTitleKey('password_reset')).toBe('passwordResetMetaTitle')
    expect(authMetaTitleKey('invalid_token')).toBe('invalidTokenMetaTitle')
  })
})
