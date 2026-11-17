import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { type SystemConfig, buildTheme, failingPairs, renderCss, renderEmail } from './tokens.ts'

const config = (JSON.parse(readFileSync('config/theme.json', 'utf8')) as { system: SystemConfig }).system

describe('buildTheme', () => {
  const theme = buildTheme(config)

  it('passes every declared contrast pair in both modes', () => {
    expect(failingPairs(theme)).toEqual([])
    expect(theme.pairs.light.length).toBeGreaterThan(40)
    expect(theme.pairs.dark.length).toBeGreaterThan(40)
  })

  it('solves text tokens to the lightest tone that still passes', () => {
    const faint = theme.pairs.light.filter(pair => pair.a === 'fg-3')
    expect(Math.min(...faint.map(pair => pair.ratio))).toBeGreaterThanOrEqual(4.5)
    expect(Math.min(...faint.map(pair => pair.ratio))).toBeLessThan(4.8)
  })

  it('reports a pair that misses its minimum', () => {
    const failing = failingPairs(buildTheme({ ...config, navy: '#9aa5b5' }))
    expect(failing).toContainEqual(expect.objectContaining({ a: 'fg-title', b: 'surface-0', mode: 'light' }))
  })

  it('keeps the shadcn names as aliases of the system tokens', () => {
    const light = new Map(theme.css.light)
    expect(light.get('background')).toBe('var(--surface-0)')
    expect(light.get('primary')).toBe('var(--action)')
    expect(light.get('destructive-text')).toBe('var(--danger-text)')
  })

  it('writes only the dark values that differ from light', () => {
    const light = new Map(theme.css.light)
    expect(theme.css.dark.every(([name, value]) => light.get(name) !== value)).toBe(true)
    expect(new Map(theme.css.dark).has('background')).toBe(false)
  })

  it('renders the css layer and the email colors', () => {
    expect(renderCss(theme)).toMatch(/^@layer base \{\n {2}:root \{/u)
    expect(renderEmail(theme)).toContain(`action: '${theme.email.action}',`)
  })
})
