#!/usr/bin/env node

import { execSync } from 'node:child_process'

const red = (text: string) => `\u001b[31m${text}\u001b[0m`
const green = (text: string) => `\u001b[32m${text}\u001b[0m`

const ci = process.env.CI === 'true'

const inGitRepository = () => {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const configureHooks = () => {
  if (!inGitRepository()) return

  try {
    execSync('lefthook install --reset-hooks-path', { stdio: 'ignore' })
    if (!ci) console.info(`${green('✓')} Git hooks installed with lefthook`)
  } catch (e) {
    console.error(`${red('✗')} Failed to install Git hooks with lefthook\n`)
    if (e instanceof Error) console.error(red(e.message))
    process.exit(1)
  }
}

configureHooks()

try {
  execSync('pnpm run typegen', { stdio: 'inherit' })
} catch {
  process.exit(1)
}
