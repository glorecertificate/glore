import { type Oklch, clampChroma, converter, formatHex, parse, wcagContrast } from 'culori'

type Mode = 'dark' | 'light'

type StatusName = 'danger' | 'info' | 'success' | 'warning'

export interface SystemConfig {
  accent: string
  base: { chroma: number; hue: number }
  contrast: { coloredText: number; margin: number; nonText: number; secondaryText: number; text: number }
  earned: string
  navy: string
  palette: Record<string, [string, string]>
  status: Record<StatusName, number>
}

type Spec =
  | { kind: 'alias'; ref: string }
  | { kind: 'fixed'; c: number; h: number; l: number }
  | { kind: 'raw'; value: string }
  | { kind: 'shift'; dl: number; from: string }
  | { kind: 'solve'; against: string[]; c: number; h: number; target: number }

interface Resolved {
  color?: Oklch
  css: string
}

interface PairResult {
  a: string
  b: string
  min: number
  ratio: number
}

export interface Theme {
  css: Record<Mode, [string, string][]>
  email: { dark: Record<string, string>; light: Record<string, string> }
  pairs: Record<Mode, PairResult[]>
}

const STATUSES: StatusName[] = ['success', 'warning', 'danger', 'info']
const STATUS_CHROMA: Record<StatusName, number> = { danger: 0.2, info: 0.14, success: 0.13, warning: 0.16 }

const toOklch = converter('oklch')

const round = (value: number, digits: number) => Number(value.toFixed(digits))

const color = (l: number, c: number, h: number) => {
  const clamped = clampChroma({ c, h, l: Math.min(Math.max(l, 0), 1), mode: 'oklch' }, 'oklch') as Oklch
  const chroma = round(clamped.c, 3)
  return { c: chroma, h: chroma === 0 ? 0 : round(clamped.h ?? h, 1), l: round(clamped.l, 3), mode: 'oklch' } as Oklch
}

const format = (value: Oklch) => `oklch(${value.l} ${value.c} ${value.h ?? 0})`

const fromHex = (hex: string) => {
  const parsed = toOklch(parse(hex))
  if (!parsed) throw new Error(`Invalid color ${hex}`)
  return color(parsed.l, parsed.c, parsed.h ?? 0)
}

const fixed = (l: number, c: number, h: number): Spec => ({ c, h, kind: 'fixed', l })
const hex = (value: string): Spec => {
  const { c, h, l } = fromHex(value)
  return fixed(l, c, h ?? 0)
}
const alias = (ref: string): Spec => ({ kind: 'alias', ref })
const shift = (from: string, dl: number): Spec => ({ dl, from, kind: 'shift' })
const raw = (value: string): Spec => ({ kind: 'raw', value })
const solve = (c: number, h: number, against: string[], target: number): Spec => ({
  against,
  c,
  h,
  kind: 'solve',
  target,
})

const passes = (l: number, c: number, h: number, backgrounds: Oklch[], target: number) =>
  backgrounds.every(background => wcagContrast(color(l, c, h), background) >= target)

const solveLightness = (c: number, h: number, backgrounds: Oklch[], target: number) => {
  const darker = backgrounds.reduce((sum, background) => sum + background.l, 0) / backgrounds.length > 0.5
  let good = darker ? 0 : 1
  let bad = darker ? 1 : 0
  for (let step = 0; step < 40; step += 1) {
    const mid = (good + bad) / 2
    const ok = passes(mid, c, h, backgrounds, target)
    good = ok ? mid : good
    bad = ok ? bad : mid
  }
  let l = darker ? Math.floor(good * 1000) / 1000 : Math.ceil(good * 1000) / 1000
  while (!passes(l, c, h, backgrounds, target)) l = round(l + (darker ? -0.001 : 0.001), 3)
  return l
}

const neutralSpecs = (config: SystemConfig, mode: Mode): [string, Spec][] => {
  const { chroma, hue } = config.base
  const { nonText, secondaryText, text } = config.contrast
  const navy = fromHex(config.navy)
  if (mode === 'light') {
    const textBackgrounds = ['surface-0', 'surface-sunken', 'surface-muted']
    return [
      ['surface-0', fixed(1, 0, hue)],
      ['surface-1', alias('surface-0')],
      ['surface-2', alias('surface-0')],
      ['surface-3', alias('surface-0')],
      ['surface-sunken', hex('#e9f1f6')],
      ['surface-muted', hex('#eef3f7')],
      ['surface-selected', hex('#e1ebf2')],
      ['surface-hover', hex('#f8fbfc')],
      ['surface-highlight', alias('surface-muted')],
      ['field', alias('surface-0')],
      ['border-subtle', hex('#e6edf3')],
      ['border', hex('#d9e3ec')],
      ['border-strong', solve(chroma * 1.3, hue, ['surface-0', 'surface-sunken'], nonText)],
      ['fg-1', hex('#0f1d2e')],
      ['fg-2', solve(chroma * 1.4, hue, textBackgrounds, secondaryText)],
      ['fg-3', solve(chroma * 1.2, hue, textBackgrounds, text)],
      ['fg-disabled', fixed(0.72, chroma * 0.8, hue)],
      ['fg-title', fixed(navy.l, navy.c, navy.h ?? hue)],
      ['fg-on-fill', fixed(1, 0, hue)],
      ['fg-on-danger', alias('fg-on-fill')],
      ['fg-on-bright', fixed(0.2, 0.03, hue)],
      ['neutral-fill', fixed(0.24, 0.03, hue)],
      ['fg-on-neutral', fixed(0.985, 0.002, hue)],
    ]
  }
  const textBackgrounds = ['surface-0', 'surface-1', 'surface-2', 'surface-3', 'surface-muted']
  return [
    ['surface-0', hex('#0f2234')],
    ['surface-1', hex('#12263a')],
    ['surface-2', hex('#172d45')],
    ['surface-3', hex('#1b3550')],
    ['surface-sunken', hex('#0b1826')],
    ['surface-muted', hex('#1a3047')],
    ['surface-selected', fixed(0.352, 0.058, 244)],
    ['surface-hover', fixed(0.318, 0.05, 251)],
    ['surface-highlight', alias('surface-hover')],
    ['field', alias('surface-1')],
    ['border-subtle', raw('oklch(1 0 0 / 6%)')],
    ['border', raw('oklch(1 0 0 / 9%)')],
    ['border-strong', solve(chroma * 1.2, hue, ['surface-0', 'surface-1', 'surface-2', 'surface-sunken'], nonText)],
    ['fg-1', hex('#e6f0f7')],
    ['fg-2', solve(chroma * 0.9, hue, textBackgrounds, secondaryText)],
    ['fg-3', solve(chroma * 0.9, hue, textBackgrounds, text)],
    ['fg-disabled', fixed(0.46, chroma, hue)],
    ['fg-title', fixed(0.935, 0.022, navy.h ?? hue)],
    ['fg-on-fill', fixed(0.17, chroma, hue)],
    ['fg-on-danger', fixed(1, 0, hue)],
    ['fg-on-bright', fixed(0.2, 0.03, hue)],
    ['neutral-fill', fixed(0.93, 0.006, hue)],
    ['fg-on-neutral', fixed(0.2, 0.02, hue)],
  ]
}

const actionSpecs = (config: SystemConfig, mode: Mode): [string, Spec][] => {
  const accent = fromHex(config.accent)
  const hue = accent.h ?? 0
  const { coloredText, text } = config.contrast
  if (mode === 'light') {
    return [
      ['brand', fixed(accent.l, accent.c, hue)],
      ['brand-hover', shift('brand', -0.05)],
      ['action', solve(accent.c * 0.92, hue + 5, ['fg-on-fill'], text)],
      ['action-hover', shift('action', -0.045)],
      ['action-subtle', fixed(0.962, 0.028, hue)],
      ['action-border', fixed(0.82, 0.075, hue)],
      [
        'action-text',
        solve(accent.c * 0.85, hue + 4, ['surface-0', 'surface-sunken', 'surface-muted', 'action-subtle'], coloredText),
      ],
      ['ring', alias('action')],
    ]
  }
  return [
    ['brand', fixed(Math.max(accent.l, 0.726), accent.c * 0.95, hue)],
    ['brand-hover', shift('brand', 0.05)],
    ['action', alias('brand')],
    ['action-hover', shift('brand', 0.045)],
    ['action-subtle', fixed(0.345, 0.062, 238)],
    ['action-border', fixed(0.45, 0.08, hue)],
    ['action-text', fixed(0.75, 0.105, hue)],
    ['ring', alias('brand')],
  ]
}

const credentialSpecs = (config: SystemConfig, mode: Mode): [string, Spec][] => {
  const earned = fromHex(config.earned)
  const navy = fromHex(config.navy)
  const earnedHue = earned.h ?? 0
  const navyHue = navy.h ?? 0
  const { coloredText } = config.contrast
  if (mode === 'light') {
    return [
      ['earned', fixed(earned.l, earned.c, earnedHue)],
      ['earned-subtle', fixed(0.962, 0.04, earnedHue)],
      ['earned-border', fixed(0.84, 0.09, earnedHue)],
      ['earned-text', solve(earned.c * 0.95, earnedHue, ['surface-0', 'surface-sunken', 'earned-subtle'], coloredText)],
      ['current-fill', fixed(navy.l, navy.c, navyHue)],
      ['current-subtle', fixed(0.952, 0.016, navyHue)],
    ]
  }
  return [
    ['earned', fixed(0.76, 0.15, earnedHue)],
    ['earned-subtle', fixed(0.26, 0.05, earnedHue)],
    ['earned-border', fixed(0.45, 0.09, earnedHue)],
    ['earned-text', fixed(0.81, 0.15, earnedHue)],
    ['current-fill', fixed(0.82, 0.06, navyHue)],
    ['current-subtle', fixed(0.27, 0.03, navyHue)],
  ]
}

const DARK_FILLS: Record<Exclude<StatusName, 'danger'>, [number, number]> = {
  info: [0.7, 0.13],
  success: [0.68, 0.15],
  warning: [0.8, 0.16],
}

const DARK_TEXT: Record<StatusName, [number, number]> = {
  danger: [0.75, 0.17],
  info: [0.75, 0.12],
  success: [0.74, 0.14],
  warning: [0.82, 0.14],
}

const statusSpecs = (config: SystemConfig, mode: Mode): [string, Spec][] =>
  STATUSES.flatMap(name => {
    const hue = config.status[name]
    const chroma = STATUS_CHROMA[name]
    const textHue = name === 'warning' ? hue - 15 : hue
    const { coloredText, text } = config.contrast
    if (mode === 'light') {
      const fill = name === 'warning' ? fixed(0.8, chroma, hue) : solve(chroma, hue, ['fg-on-fill'], text)
      return [
        [`${name}-fill`, fill],
        [`${name}-fill-hover`, shift(`${name}-fill`, -0.04)],
        [`${name}-subtle`, fixed(0.966, name === 'warning' ? 0.05 : 0.03, hue)],
        [`${name}-border`, fixed(0.86, 0.08, hue)],
        [`${name}-text`, solve(chroma * 0.85, textHue, ['surface-0', 'surface-sunken', `${name}-subtle`], coloredText)],
      ] satisfies [string, Spec][]
    }
    const [textL, textC] = DARK_TEXT[name]
    const fill = name === 'danger' ? solve(chroma, hue, ['fg-on-danger'], text) : fixed(...DARK_FILLS[name], hue)
    return [
      [`${name}-fill`, fill],
      [`${name}-fill-hover`, shift(`${name}-fill`, name === 'danger' ? -0.04 : 0.04)],
      [`${name}-subtle`, fixed(0.25, 0.045, hue)],
      [`${name}-border`, fixed(0.42, 0.08, hue)],
      [`${name}-text`, fixed(textL, textC, textHue)],
    ] satisfies [string, Spec][]
  })

const legacyFixedSpecs = (mode: Mode): [string, Spec][] => {
  if (mode === 'light') {
    return [
      ['input', fixed(0.91, 0.008, 256)],
      ['brand-secondary', fixed(0.77, 0.165, 122.4)],
      ['brand-secondary-accent', fixed(0.72, 0.16, 122.4)],
      ['brand-tertiary', fixed(0.346, 0.074, 256)],
      ['brand-tertiary-accent', fixed(0.3, 0.065, 256)],
      ['brand-tertiary-foreground', fixed(1, 0, 256)],
      ['brand-tertiary-text', fixed(0.346, 0.074, 256)],
      ['brand-quaternary', fixed(0.55, 0.09, 195)],
      ['brand-quaternary-accent', fixed(0.5, 0.085, 195)],
      ['brand-quaternary-foreground', fixed(1, 0, 195)],
      ['brand-quaternary-text', fixed(0.5, 0.085, 195)],
      ['editor-highlight', fixed(0.88, 0.14, 95)],
      ['shadow-ink', hex('#16304f')],
      ['shadow-a1', raw('4%')],
      ['shadow-a2', raw('6%')],
      ['shadow-a3', raw('9%')],
      ['shadow-a4', raw('12%')],
    ]
  }
  return [
    ['input', raw('oklch(1 0 0 / 14%)')],
    ['brand-secondary', fixed(0.77, 0.165, 122.4)],
    ['brand-secondary-accent', fixed(0.81, 0.15, 122.4)],
    ['brand-tertiary', fixed(0.42, 0.085, 256)],
    ['brand-tertiary-accent', fixed(0.47, 0.09, 256)],
    ['brand-tertiary-foreground', fixed(1, 0, 256)],
    ['brand-tertiary-text', fixed(0.72, 0.1, 256)],
    ['brand-quaternary', fixed(0.68, 0.1, 192)],
    ['brand-quaternary-accent', fixed(0.73, 0.095, 192)],
    ['brand-quaternary-foreground', fixed(0.2, 0.04, 256)],
    ['brand-quaternary-text', fixed(0.76, 0.1, 190)],
    ['editor-highlight', raw('oklch(0.6 0.12 90 / 45%)')],
    ['shadow-ink', fixed(0.05, 0.01, 256)],
    ['shadow-a1', raw('30%')],
    ['shadow-a2', raw('36%')],
    ['shadow-a3', raw('46%')],
    ['shadow-a4', raw('55%')],
  ]
}

const paletteSpecs = (config: SystemConfig, mode: Mode): [string, Spec][] =>
  Object.entries(config.palette).map(([name, [light, dark]]) => {
    const value = mode === 'light' ? light : dark
    return [name, value.startsWith('#') ? hex(value) : raw(value)]
  })

const ALIASES: [string, string][] = [
  ['background', 'surface-0'],
  ['foreground', 'fg-1'],
  ['card', 'surface-1'],
  ['card-foreground', 'fg-1'],
  ['popover', 'surface-2'],
  ['popover-foreground', 'fg-1'],
  ['muted', 'surface-muted'],
  ['muted-foreground', 'fg-2'],
  ['accent', 'surface-highlight'],
  ['accent-foreground', 'fg-1'],
  ['primary', 'action'],
  ['primary-foreground', 'fg-on-fill'],
  ['secondary', 'neutral-fill'],
  ['secondary-foreground', 'fg-on-neutral'],
  ['brand-accent', 'brand-hover'],
  ['brand-foreground', 'fg-on-bright'],
  ['brand-text', 'action-text'],
  ['brand-secondary-foreground', 'fg-on-bright'],
  ['brand-secondary-text', 'earned-text'],
  ['link', 'action-text'],
  ['link-accent', 'fg-title'],
  ['info', 'info-fill'],
  ['info-accent', 'info-fill-hover'],
  ['info-foreground', 'fg-on-fill'],
  ['success', 'success-fill'],
  ['success-accent', 'success-fill-hover'],
  ['success-foreground', 'fg-on-fill'],
  ['warning', 'warning-fill'],
  ['warning-accent', 'warning-fill-hover'],
  ['warning-foreground', 'fg-on-bright'],
  ['destructive', 'danger-fill'],
  ['destructive-accent', 'danger-fill-hover'],
  ['destructive-foreground', 'fg-on-danger'],
  ['destructive-text', 'danger-text'],
  ['header', 'surface-0'],
  ['header-foreground', 'fg-1'],
  ['header-primary', 'action'],
  ['header-primary-foreground', 'fg-on-fill'],
  ['header-accent', 'surface-highlight'],
  ['header-accent-foreground', 'fg-1'],
  ['header-border', 'border-subtle'],
  ['header-ring', 'ring'],
  ['chart-1', 'chart-teal'],
  ['chart-2', 'chart-green'],
  ['chart-3', 'brand-tertiary-text'],
  ['chart-4', 'brand-quaternary'],
  ['chart-5', 'warning-text'],
]

const PALETTE_PAIRS: [string, string, 'nonText' | 'text'][] = [
  ['sidebar-foreground', 'sidebar', 'text'],
  ['sidebar-muted', 'sidebar', 'text'],
  ['sidebar-accent-foreground', 'sidebar', 'text'],
  ['action-foreground', 'action-from', 'text'],
  ['action-foreground', 'action-to', 'text'],
  ['nav-foreground', 'nav-from', 'text'],
  ['nav-foreground', 'nav-to', 'text'],
  ['sidebar-badge-foreground', 'sidebar-badge', 'text'],
  ['sidebar-primary-foreground', 'sidebar-primary', 'text'],
  ['aside-foreground', 'aside-from', 'text'],
  ['aside-foreground', 'aside-via', 'text'],
  ['aside-foreground', 'aside-via-2', 'text'],
  ['aside-foreground', 'aside-to', 'nonText'],
  ['aside-muted', 'aside-from', 'text'],
  ['aside-muted', 'aside-via', 'text'],
  ['aside-muted', 'aside-via-2', 'text'],
  ['aside-text', 'aside-from', 'text'],
  ['aside-text', 'aside-via', 'text'],
  ['band-foreground', 'band-from', 'text'],
  ['band-muted', 'band-from', 'text'],
  ['band-text', 'band-from', 'text'],
  ['band-action-foreground', 'band-action', 'text'],
  ['band-action-foreground', 'band-action-hover', 'text'],
  ['highlight-foreground', 'highlight-from', 'text'],
  ['highlight-foreground', 'highlight-to', 'text'],
  ['highlight-muted', 'highlight-from', 'text'],
  ['highlight-muted', 'highlight-to', 'text'],
  ['stat-teal-foreground', 'stat-teal-from', 'nonText'],
  ['stat-teal-foreground', 'stat-teal-to', 'nonText'],
  ['stat-navy-foreground', 'stat-navy-from', 'nonText'],
  ['stat-navy-foreground', 'stat-navy-to', 'nonText'],
  ['stat-green-foreground', 'stat-green-from', 'nonText'],
  ['stat-green-foreground', 'stat-green-to', 'nonText'],
  ['stat-amber-foreground', 'stat-amber-from', 'nonText'],
  ['stat-amber-foreground', 'stat-amber-to', 'nonText'],
  ['stat-teal-text', 'surface-1', 'text'],
  ['stat-navy-text', 'surface-1', 'text'],
  ['stat-green-text', 'surface-1', 'text'],
  ['stat-amber-text', 'surface-1', 'text'],
  ['pill-approved-foreground', 'pill-approved', 'text'],
  ['pill-review-foreground', 'pill-review', 'text'],
  ['pill-draft-foreground', 'pill-draft', 'text'],
  ['chart-teal', 'surface-1', 'nonText'],
  ['chart-green', 'surface-1', 'nonText'],
]

const COLORED_TEXT: [string, string][] = [
  ['action-text', 'action-subtle'],
  ['earned-text', 'earned-subtle'],
  ...STATUSES.map(name => [`${name}-text`, `${name}-subtle`] as [string, string]),
]

const declaredPairs = (config: SystemConfig, mode: Mode): [string, string, number][] => {
  const { coloredText, nonText, text } = config.contrast
  const surfaces =
    mode === 'light'
      ? ['surface-0', 'surface-sunken', 'surface-muted', 'surface-selected']
      : ['surface-0', 'surface-1', 'surface-2', 'surface-3', 'surface-sunken', 'surface-muted', 'surface-selected']
  const coloredPairs =
    mode === 'light'
      ? []
      : COLORED_TEXT.flatMap(([token, subtle]) =>
          ['surface-0', 'surface-1', 'surface-2', 'surface-3', 'surface-sunken', subtle].map(
            surface => [token, surface, coloredText] as [string, string, number]
          )
        )
  const palettePairs = PALETTE_PAIRS.map(
    ([a, b, kind]) => [a, b, kind === 'text' ? text : nonText] as [string, string, number]
  )
  return [
    ...coloredPairs,
    ...palettePairs,
    ...surfaces.map(surface => ['fg-1', surface, text] as [string, string, number]),
    ...['surface-0', 'surface-sunken', 'surface-muted', 'current-subtle'].map(
      surface => ['fg-title', surface, text] as [string, string, number]
    ),
    ['action', 'fg-on-fill', text],
    ['action-hover', 'fg-on-fill', text],
    ['brand', 'fg-on-bright', text],
    ['neutral-fill', 'fg-on-neutral', text],
    ['warning-fill', 'fg-on-bright', text],
    ['success-fill', 'fg-on-fill', text],
    ['info-fill', 'fg-on-fill', text],
    ['danger-fill', 'fg-on-danger', text],
    ['danger-fill-hover', 'fg-on-danger', text],
    ['ring', 'surface-0', nonText],
    ['ring', 'surface-sunken', nonText],
    ['earned', 'surface-0', nonText],
    ['earned', 'earned-subtle', nonText],
    ['current-fill', 'surface-0', nonText],
    ['current-fill', 'current-subtle', nonText],
    ['brand-tertiary', 'brand-tertiary-foreground', text],
    ['brand-quaternary', 'brand-quaternary-foreground', text],
    ['brand-secondary', 'fg-on-bright', text],
  ]
}

const resolveMode = (config: SystemConfig, mode: Mode) => {
  const { margin } = config.contrast
  const specs = [
    ...neutralSpecs(config, mode),
    ...actionSpecs(config, mode),
    ...credentialSpecs(config, mode),
    ...statusSpecs(config, mode),
    ...legacyFixedSpecs(mode),
    ...paletteSpecs(config, mode),
    ...ALIASES.map(([name, ref]) => [name, alias(ref)] as [string, Spec]),
  ]
  const resolved = new Map<string, Resolved>()
  const solved: [string, string, number][] = []
  const get = (name: string) => {
    const entry = resolved.get(name)
    if (!entry?.color) throw new Error(`Token ${name} is used before it has a color`)
    return entry.color
  }
  for (const [name, spec] of specs) {
    if (spec.kind === 'raw') {
      resolved.set(name, { css: spec.value })
      continue
    }
    if (spec.kind === 'alias') {
      const target = resolved.get(spec.ref)
      if (!target) throw new Error(`Token ${name} aliases ${spec.ref}, which is not defined yet`)
      resolved.set(name, { color: target.color, css: `var(--${spec.ref})` })
      continue
    }
    if (spec.kind === 'shift') {
      const base = get(spec.from)
      const value = color(base.l + spec.dl, base.c, base.h ?? 0)
      resolved.set(name, { color: value, css: format(value) })
      continue
    }
    if (spec.kind === 'fixed') {
      const value = color(spec.l, spec.c, spec.h)
      resolved.set(name, { color: value, css: format(value) })
      continue
    }
    const l = solveLightness(spec.c, spec.h, spec.against.map(get), spec.target + margin)
    const value = color(l, spec.c, spec.h)
    resolved.set(name, { color: value, css: format(value) })
    solved.push(...spec.against.map(other => [name, other, spec.target] as [string, string, number]))
  }
  const pairs = [...solved, ...declaredPairs(config, mode)].map(([a, b, min]) => ({
    a,
    b,
    min,
    ratio: round(wcagContrast(get(a), get(b)), 2),
  }))
  return { pairs, resolved, tokens: specs.map(([name]) => name) }
}

export const buildTheme = (config: SystemConfig): Theme => {
  const light = resolveMode(config, 'light')
  const dark = resolveMode(config, 'dark')
  const lightCss = light.tokens.map(name => [name, light.resolved.get(name)?.css ?? ''] as [string, string])
  const darkCss = dark.tokens
    .map(name => [name, dark.resolved.get(name)?.css ?? ''] as [string, string])
    .filter(([name, value]) => value.startsWith('var(') || light.resolved.get(name)?.css !== value)
  const hexOf = (mode: typeof light, name: string) => {
    const value = mode.resolved.get(name)?.color
    if (!value) throw new Error(`Token ${name} has no color`)
    return formatHex(value)
  }
  const emailOf = (mode: typeof light, border: string) => ({
    action: hexOf(mode, 'action'),
    actionText: hexOf(mode, 'action-text'),
    bandFrom: hexOf(mode, 'aside-from'),
    bandTo: hexOf(mode, 'aside-to'),
    bandVia: hexOf(mode, 'aside-via'),
    bandVia2: hexOf(mode, 'aside-via-2'),
    border: hexOf(mode, border),
    canvas: hexOf(mode, 'surface-sunken'),
    danger: hexOf(mode, 'danger-fill'),
    faint: hexOf(mode, 'fg-3'),
    muted: hexOf(mode, 'fg-2'),
    onDanger: hexOf(mode, 'fg-on-danger'),
    onFill: hexOf(mode, 'fg-on-fill'),
    sunken: hexOf(mode, 'surface-muted'),
    surface: hexOf(mode, 'surface-0'),
    text: hexOf(mode, 'fg-1'),
    title: hexOf(mode, 'fg-title'),
  })
  return {
    css: { dark: darkCss, light: lightCss },
    email: { dark: emailOf(dark, 'surface-selected'), light: emailOf(light, 'border-subtle') },
    pairs: { dark: dark.pairs, light: light.pairs },
  }
}

export const failingPairs = (theme: Theme) =>
  (['light', 'dark'] as const).flatMap(mode =>
    theme.pairs[mode].filter(pair => pair.ratio < pair.min).map(pair => ({ ...pair, mode }))
  )

const block = (selector: string, entries: [string, string][]) =>
  [`  ${selector} {`, ...entries.map(([name, value]) => `    --${name}: ${value};`), '  }'].join('\n')

const SCOPED = ['sidebar']

export const renderCss = (theme: Theme) =>
  [
    '@layer base {',
    block(':root', theme.css.light),
    '',
    block('.dark', theme.css.dark),
    '',
    block(
      ':root:not(.dark) .sidebar-scope',
      theme.css.light.filter(([name]) => SCOPED.includes(name))
    ),
    '}',
    '',
  ].join('\n')

const emailBlock = (name: string, entries: Record<string, string>) => [
  `export const ${name} = {`,
  ...Object.entries(entries)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `  ${key}: '${value}',`),
  '} as const',
]

export const renderEmail = (theme: Theme) =>
  [...emailBlock('EMAIL_COLORS', theme.email.light), '', ...emailBlock('EMAIL_COLORS_DARK', theme.email.dark), ''].join(
    '\n'
  )
