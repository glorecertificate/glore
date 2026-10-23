import { createElement } from 'react'

import { render } from 'react-email'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AccountPasswordChangedEmail from '@/emails/account/password-changed'
import AccountStatusEmail from '@/emails/account/status'
import { DEFAULT_SETTINGS } from '@/lib/app-settings'
import itMessages from '~/messages/it.json'

const settings = {
  ...DEFAULT_SETTINGS,
  email: 'team@example.org',
  legalEntity: { address: '1 Main Street, Springfield', country: 'es', name: 'Acme Association' },
  social: { ...DEFAULT_SETTINGS.social, linkedin: 'https://linkedin.com/company/acme' },
  website: 'https://acme.example.org',
}

describe('email contact settings', () => {
  beforeEach(() => {
    vi.stubEnv('APP_URL', 'https://glore.test')
  })

  it('reaches the layout footer and the mailto links of a template', async () => {
    const html = await render(createElement(AccountPasswordChangedEmail, { settings }))
    expect(html).toContain('mailto:team@example.org')
    expect(html).toContain('href="https://acme.example.org"')
    expect(html).toContain('Acme Association, 1 Main Street, Springfield, Spain')
    expect(html).toContain('Acme Association. All rights reserved.')
    expect(html).toContain('href="https://linkedin.com/company/acme"')
    expect(html).not.toContain(DEFAULT_SETTINGS.email)
  })

  it('reaches the notice footer of a shared template', async () => {
    const html = await render(createElement(AccountStatusEmail, { kind: 'deleted', settings }))
    expect(html).toContain('mailto:team@example.org')
    expect(html).not.toContain(DEFAULT_SETTINGS.email)
  })

  it('names the legal entity country in the email language', async () => {
    const html = await render(createElement(AccountPasswordChangedEmail, { locale: 'it', messages: itMessages }))
    expect(html).toContain(`${DEFAULT_SETTINGS.legalEntity.address}, Italia`)
    expect(html).not.toContain('Italy')
  })

  it('keeps working with the config defaults when no settings are passed', async () => {
    const html = await render(createElement(AccountPasswordChangedEmail, {}))
    expect(html).toContain(`mailto:${DEFAULT_SETTINGS.email}`)
    expect(html).toContain(DEFAULT_SETTINGS.legalEntity.name)
    expect(html).not.toContain('linkedin.com')
  })
})
