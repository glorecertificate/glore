import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { type Counts, type Diagnostic, compareCounts, countByFolder, formatCounts, violationsFor } from './ratchet.ts'

const BASELINE = join('scripts', 'lint', 'ratchet.json')
const EXEMPT = ['src/components/ui/rich-text-editor/**', 'src/emails/**']

const exec = promisify(execFile)

const gitFiles = async (args: string[]) => {
  try {
    const { stdout } = await exec('git', args)
    return stdout.split('\n').filter(Boolean)
  } catch {
    return []
  }
}

const mode = process.argv.includes('--reset') ? 'reset' : process.argv.includes('--update') ? 'update' : 'check'

const { stdout } = await exec(
  join('node_modules', '.bin', 'oxlint'),
  [
    '-c',
    join('scripts', 'lint', 'oxlintrc.json'),
    '-f',
    'json',
    ...EXEMPT.flatMap(pattern => ['--ignore-pattern', pattern]),
    'src',
  ],
  { maxBuffer: 64 * 1024 * 1024 }
)
const { diagnostics } = JSON.parse(stdout) as { diagnostics: Diagnostic[] }
const current = countByFolder(diagnostics)

if (mode === 'reset') {
  await writeFile(BASELINE, formatCounts(current))
  console.info(`Wrote ${BASELINE} with ${diagnostics.length} violations.`)
  process.exit(0)
}

const baseline = JSON.parse(await readFile(BASELINE, 'utf8')) as Counts
const { decreased, increased } = compareCounts(baseline, current)

if (increased.length > 0) {
  const lists = await Promise.all([
    gitFiles(['diff', '--name-only', 'HEAD']),
    gitFiles(['ls-files', '--others', '--exclude-standard']),
    gitFiles(['diff', '--name-only', 'origin/HEAD...HEAD']),
  ])
  const changedFiles = new Set(lists.flat())
  for (const change of increased) {
    console.error(`${change.folder}: ${change.rule} went from ${change.baseline} to ${change.current}.`)
    for (const line of violationsFor(diagnostics, change, changedFiles)) console.error(`  ${line}`)
  }
  console.error('Fix the new violations. The counts in scripts/lint/ratchet.json can only go down.')
  process.exit(1)
}

if (mode === 'update') {
  await writeFile(BASELINE, formatCounts(current))
  console.info(`Lowered ${decreased.length} counts in ${BASELINE}.`)
  process.exit(0)
}

if (decreased.length > 0) {
  for (const change of decreased) {
    console.error(`${change.folder}: ${change.rule} went from ${change.baseline} to ${change.current}.`)
  }
  console.error('Run pnpm run lint:ratchet to lower the counts in scripts/lint/ratchet.json.')
  process.exit(1)
}

console.info(`Lint ratchet holds at ${diagnostics.length} violations.`)
