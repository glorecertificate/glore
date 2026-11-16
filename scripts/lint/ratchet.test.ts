import { describe, expect, it } from 'vitest'

import { type Diagnostic, compareCounts, countByFolder, formatCounts, ruleName, violationsFor } from './ratchet.ts'

const diagnostic = (filename: string, rule: string, line = 1): Diagnostic => ({
  code: `tailwindcss(${rule})`,
  filename,
  labels: [{ span: { column: 3, line } }],
  message: `"w-[3px]" breaks ${rule}.`,
})

describe('ratchet', () => {
  const diagnostics = [
    diagnostic('src/components/ui/button.tsx', 'no-arbitrary-value'),
    diagnostic('src/components/ui/badge.tsx', 'no-arbitrary-value', 7),
    diagnostic('src/components/ui/badge.tsx', 'no-default-palette'),
    diagnostic('src/app/page.tsx', 'no-restricted-classes'),
  ]

  it('reads the rule name from the plugin code', () => {
    expect(ruleName('tailwindcss(no-arbitrary-value)')).toBe('no-arbitrary-value')
  })

  it('counts violations per folder and rule in a stable order', () => {
    const counts = countByFolder(diagnostics)
    expect(Object.keys(counts)).toEqual(['src/app', 'src/components/ui'])
    expect(counts['src/components/ui']).toEqual({ 'no-arbitrary-value': 2, 'no-default-palette': 1 })
  })

  it('reports increases, decreases, and new folders', () => {
    const baseline = { 'src/app': { 'no-restricted-classes': 2 }, 'src/components/ui': { 'no-arbitrary-value': 2 } }
    const { decreased, increased } = compareCounts(baseline, countByFolder(diagnostics))
    expect(decreased).toEqual([{ baseline: 2, current: 1, folder: 'src/app', rule: 'no-restricted-classes' }])
    expect(increased).toEqual([{ baseline: 0, current: 1, folder: 'src/components/ui', rule: 'no-default-palette' }])
  })

  it('finds no change when the counts match', () => {
    const counts = countByFolder(diagnostics)
    expect(compareCounts(counts, counts)).toEqual({ decreased: [], increased: [] })
  })

  it('lists the violations behind an increase', () => {
    const lines = violationsFor(diagnostics, {
      baseline: 1,
      current: 2,
      folder: 'src/components/ui',
      rule: 'no-arbitrary-value',
    })
    expect(lines).toEqual([
      'src/components/ui/button.tsx:1:3 "w-[3px]" breaks no-arbitrary-value.',
      'src/components/ui/badge.tsx:7:3 "w-[3px]" breaks no-arbitrary-value.',
    ])
  })

  it('limits the list to changed files when one matches', () => {
    const change = { baseline: 1, current: 2, folder: 'src/components/ui', rule: 'no-arbitrary-value' }
    expect(violationsFor(diagnostics, change, new Set(['src/components/ui/badge.tsx']))).toEqual([
      'src/components/ui/badge.tsx:7:3 "w-[3px]" breaks no-arbitrary-value.',
    ])
    expect(violationsFor(diagnostics, change, new Set(['src/app/page.tsx']))).toHaveLength(2)
  })

  it('formats the baseline as sorted json with a final newline', () => {
    expect(formatCounts({ b: { y: 1, x: 2 }, a: { z: 3 } })).toBe(
      '{\n  "a": {\n    "z": 3\n  },\n  "b": {\n    "x": 2,\n    "y": 1\n  }\n}\n'
    )
  })
})
