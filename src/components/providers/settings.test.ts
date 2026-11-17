import { createElement } from 'react'

import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SettingsProvider, useSettings } from '@/components/providers/settings'
import { DEFAULT_SETTINGS } from '@/lib/app-settings'

const Probe = () => createElement('p', null, useSettings().email)

describe('useSettings', () => {
  it('reads the settings of the provider', () => {
    const settings = { ...DEFAULT_SETTINGS, email: 'team@example.org' }
    const html = renderToString(createElement(SettingsProvider, { settings }, createElement(Probe)))
    expect(html).toBe('<p>team@example.org</p>')
  })

  it('throws outside a provider', () => {
    expect(() => renderToString(createElement(Probe))).toThrow('useSettings must be used within a SettingsProvider')
  })
})
