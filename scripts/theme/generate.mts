import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { type SystemConfig, buildTheme, failingPairs, renderCss, renderEmail } from './tokens.ts'

const OUTPUTS = {
  css: join('src', 'styles', 'tokens.generated.css'),
  email: join('src', 'emails', 'colors.generated.ts'),
}

const check = process.argv.includes('--check')
const config = JSON.parse(await readFile(join('config', 'theme.json'), 'utf8')) as { system: SystemConfig }
const theme = buildTheme(config.system)
const failures = failingPairs(theme)

if (failures.length > 0) {
  for (const pair of failures) {
    console.error(`${pair.mode}: ${pair.a} on ${pair.b} is ${pair.ratio}:1, needs ${pair.min}:1`)
  }
  process.exit(1)
}

const files: [string, string][] = [
  [OUTPUTS.css, renderCss(theme)],
  [OUTPUTS.email, renderEmail(theme)],
]

if (check) {
  const stale = []
  for (const [path, content] of files) {
    const current = await readFile(path, 'utf8').catch(() => '')
    if (current !== content) stale.push(path)
  }
  if (stale.length > 0) {
    console.error(`Stale theme output: ${stale.join(', ')}. Run pnpm run theme.`)
    process.exit(1)
  }
  console.info(`Theme is current. ${theme.pairs.light.length + theme.pairs.dark.length} contrast pairs pass.`)
  process.exit(0)
}

await Promise.all(files.map(([path, content]) => writeFile(path, content)))
console.info(`Wrote ${files.map(([path]) => path).join(', ')}.`)
