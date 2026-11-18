#!/usr/bin/env node

import { appendFile, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parseArgs } from 'node:util'

type Kind = 'interaction' | 'load' | 'navigation'
type Profile = 'desktop' | 'mobile'
type Status = 'miss' | 'ok' | 'regressed' | 'unchecked'

interface Result {
  devMode?: boolean
  from?: string
  id: string
  kind: Kind
  metrics: Record<string, number>
  name?: string
  path?: string
  profile: Profile
  role: string
  runs: number
  samples?: Record<string, number[]>
  to?: string
}

interface PerfConfig {
  budgets: { prefetchKb: { app: number; public: number }; scriptKb: { app: number; public: number } }
  publicPaths: string[]
  regression: { floor: { cls: number; kb: number; ms: number }; ratio: number }
  targets: Record<Kind, Record<Profile, Record<string, number>>>
}

interface Cell {
  baseline?: number
  metric: string
  status: Status
  target?: number
  value: number
}

const KINDS: Kind[] = ['load', 'navigation', 'interaction']
const PROFILES: Profile[] = ['desktop', 'mobile']

const TITLES: Record<Kind, string> = {
  interaction: 'Interactions',
  load: 'Page loads',
  navigation: 'Client navigations',
}

const COLUMNS: Record<Kind, string[]> = {
  interaction: ['latency', 'blocking'],
  load: ['ttfb', 'fcp', 'lcp', 'cls', 'tbt', 'hydration', 'scriptKb', 'prefetchKb'],
  navigation: ['shell', 'complete', 'shift'],
}

const LABELS: Record<string, string> = {
  blocking: 'Blocking ms',
  cls: 'CLS',
  complete: 'Complete ms',
  fcp: 'FCP ms',
  hydration: 'Hydration ms',
  latency: 'Latency ms',
  lcp: 'LCP ms',
  prefetchKb: 'Prefetch KB',
  scriptKb: 'JS KB',
  shell: 'Shell (active) ms',
  shift: 'Shift',
  tbt: 'TBT ms',
  ttfb: 'TTFB ms',
}

const MARKS: Record<Status, string> = { miss: ' ✗', ok: ' ✓', regressed: ' ▲', unchecked: '' }

const { values: args } = parseArgs({
  options: {
    baseline: { type: 'string' },
    results: { default: join('.playwright', 'perf', 'results'), type: 'string' },
    strict: { default: false, type: 'boolean' },
  },
})

const config = JSON.parse(await readFile(join('config', 'performance.json'), 'utf8')) as PerfConfig

const listFiles = async (dir: string) => {
  try {
    return await readdir(dir)
  } catch {
    return []
  }
}

const readResults = async (dir: string) => {
  const files = (await listFiles(dir)).filter(file => file.endsWith('.json'))
  const results = await Promise.all(
    files.map(async file => JSON.parse(await readFile(join(dir, file), 'utf8')) as Result)
  )
  return new Map(results.map(result => [result.id, result]))
}

const current = await readResults(args.results)
const baseline = args.baseline ? await readResults(args.baseline) : new Map<string, Result>()
const devMode = [...current.values(), ...baseline.values()].some(result => result.devMode)

const floorFor = (metric: string) => {
  if (metric === 'cls' || metric === 'shift') return config.regression.floor.cls
  if (metric === 'scriptKb' || metric === 'prefetchKb') return config.regression.floor.kb
  return config.regression.floor.ms
}

const targetFor = (result: Result, metric: string) => {
  if (metric !== 'scriptKb' && metric !== 'prefetchKb') return config.targets[result.kind][result.profile][metric]
  const budget = config.budgets[metric]
  if (config.publicPaths.includes(result.path ?? '')) return budget.public
  return budget.app
}

const isNumber = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value)

const fastest = (result: Result, metric: string) => Math.min(...(result.samples?.[metric] ?? [Number.NaN]))

const regressed = (result: Result, value: number, base: number | undefined, metric: string) => {
  if (!isNumber(base)) return false
  if (value <= base * (1 + config.regression.ratio) || value - base <= floorFor(metric)) return false
  const best = fastest(result, metric)
  return !isNumber(best) || best > base + floorFor(metric)
}

const evaluate = (result: Result, metric: string): Cell => {
  const value = result.metrics[metric] ?? Number.NaN
  const cell = { baseline: baseline.get(result.id)?.metrics[metric], metric, target: targetFor(result, metric), value }
  if (devMode || !isNumber(value)) return { ...cell, status: 'unchecked' }
  if (regressed(result, value, cell.baseline, metric)) return { ...cell, status: 'regressed' }
  if (isNumber(cell.target) && value > cell.target) return { ...cell, status: 'miss' }
  return { ...cell, status: 'ok' }
}

const format = (metric: string, value: number | undefined) => {
  if (!isNumber(value)) return 'n/a'
  if (metric === 'cls' || metric === 'shift') return value.toFixed(3)
  return String(Math.round(value))
}

const deltaText = (cell: Cell) => {
  if (!isNumber(cell.baseline) || cell.baseline <= 0 || !isNumber(cell.value)) return ''
  const percent = Math.round(((cell.value - cell.baseline) / cell.baseline) * 100)
  if (percent === 0) return ''
  return ` (${percent > 0 ? '+' : ''}${percent}%)`
}

const caseLabel = (result: Result) => {
  if (result.kind === 'navigation') return `${result.profile} ${result.role} ${result.from} to ${result.to}`
  if (result.kind === 'interaction') return `${result.profile} ${result.role} ${result.name}`
  return `${result.profile} ${result.role} ${result.path}`
}

const targetCell = (kind: Kind, profile: Profile, metric: string) => {
  if (metric === 'scriptKb' || metric === 'prefetchKb') {
    return `${config.budgets[metric].public} / ${config.budgets[metric].app}`
  }
  return format(metric, config.targets[kind][profile][metric])
}

const evaluated = [...current.values()]
  .toSorted((left, right) => left.id.localeCompare(right.id))
  .map(result => ({ cells: COLUMNS[result.kind].map(metric => evaluate(result, metric)), result }))

const collect = (status: Status) =>
  evaluated.flatMap(({ cells, result }) =>
    cells.filter(cell => cell.status === status).map(cell => `${caseLabel(result)}: ${LABELS[cell.metric]}`)
  )

const regressions = collect('regressed')
const misses = collect('miss')
const missing = [...baseline.keys()].filter(id => !current.has(id))
const unmatched = baseline.size ? [...current.keys()].filter(id => !baseline.has(id)) : []

const renderTable = (kind: Kind) => {
  const rows = evaluated.filter(({ result }) => result.kind === kind)
  if (!rows.length) return []
  const columns = COLUMNS[kind]
  return [
    `### ${TITLES[kind]}`,
    '',
    `| Case | ${columns.map(column => LABELS[column]).join(' | ')} |`,
    `| --- | ${columns.map(() => '---:').join(' | ')} |`,
    ...PROFILES.map(
      profile => `| _Target ${profile}_ | ${columns.map(column => targetCell(kind, profile, column)).join(' | ')} |`
    ),
    ...rows.map(
      ({ cells, result }) =>
        `| ${caseLabel(result)} | ${cells.map(cell => `${format(cell.metric, cell.value)}${MARKS[cell.status]}${deltaText(cell)}`).join(' | ')} |`
    ),
    '',
  ]
}

const notes = [
  ...(devMode
    ? [
        'The results come from a dev server, so the report checks no target or baseline. Run `next start` for comparable numbers.',
      ]
    : []),
  ...(args.baseline && !baseline.size
    ? ['No baseline results were found, so the report checks the targets only.']
    : []),
  ...(regressions.length ? [`Regressions against the baseline: ${regressions.join(', ')}.`] : []),
  ...(misses.length ? [`Target misses: ${misses.length}.`] : []),
  ...(missing.length ? [`Cases in the baseline but not in this run: ${missing.join(', ')}.`] : []),
  ...(unmatched.length ? [`Cases without a baseline: ${unmatched.join(', ')}.`] : []),
]

const report = [
  '## Performance',
  '',
  `Medians of ${Math.max(...evaluated.map(({ result }) => result.runs), 0)} runs per case. ✓ meets the target and ✗ misses it. ▲ is a regression: the median grew by more than ${config.regression.ratio * 100}% and the noise floor, and even the fastest run is slower than the baseline median plus the noise floor.`,
  '',
  ...notes.flatMap(note => [`- ${note}`]),
  ...(notes.length ? [''] : []),
  ...KINDS.flatMap(renderTable),
].join('\n')

if (!current.size) {
  console.error(`No performance results found in ${args.results}.`)
  process.exit(1)
}

await writeFile(join(dirname(args.results), 'report.md'), report)
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${report}\n`)
console.info(report)

const failed = !devMode && (regressions.length > 0 || (args.strict && misses.length > 0))
process.exitCode = failed ? 1 : 0
