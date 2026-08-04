#!/usr/bin/env node

import { execSync } from 'node:child_process'

const HOOKS_PATH = '.githooks'

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
    execSync(`git config core.hooksPath ${HOOKS_PATH}`, { stdio: 'ignore' })
    if (!ci) console.info(`${green('✓')} Git hooks configured in ${HOOKS_PATH}`)
  } catch (e) {
    console.error(`${red('✗')} Failed to set core.hooksPath to ${HOOKS_PATH}\n`)
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
