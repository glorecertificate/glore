import { createElement } from 'react'

import { type Messages, useTranslations } from 'next-intl'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { pickMessages } from '@/lib/i18n'
import { MESSAGE_SCOPES } from '@/lib/message-scopes'
import en from '~/messages/en.json'

vi.mock('@/actions/cookies', () => ({ setLocaleCookie: vi.fn() }))
vi.mock('@/actions/i18n', () => ({ getClientMessages: vi.fn() }))

const { I18nProvider, ScopedMessagesProvider } = await import('@/components/providers/i18n')

const messages = en as unknown as Messages

const Probe = () => {
  const common = useTranslations('Common')
  const auth = useTranslations('Auth')
  return createElement('p', null, `${common('backToHome')} / ${auth('backToLogin')}`)
}

describe('ScopedMessagesProvider', () => {
  it('adds its namespaces to the root messages and keeps the locale', () => {
    const html = renderToString(
      createElement(
        I18nProvider,
        { locale: 'en', messages: pickMessages(messages, MESSAGE_SCOPES.root), timeZone: 'Europe/Rome' },
        createElement(ScopedMessagesProvider, { messages: pickMessages(messages, ['Auth']) }, createElement(Probe))
      )
    )
    expect(html).toBe(`<p>${en.Common.backToHome} / ${en.Auth.backToLogin}</p>`)
  })
})
