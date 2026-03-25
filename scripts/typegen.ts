#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { stdout } from 'node:process'

const ARGS = ['env', 'routes'] as const
const ENV_DTS = './env.d.ts'
const NEXT_DTS = ['.next/types/link.d.ts', '.next/types/routes.d.ts']

const args = process.argv.slice(2)
const types = args && args.length > 0 ? args : ARGS

const red = (text: string) => `\u001b[31m${text}\u001b[0m`
const green = (text: string) => `\u001b[32m${text}\u001b[0m`
const clearLine = () => {
  if (stdout.isTTY) {
    stdout.clearLine(0)
    stdout.cursorTo(0)
  }
}

const listPublicDir = (dir = '') => {
  const files: string[] = []

  for (const dirent of readdirSync(`./public${dir ? `/${dir}` : ''}`, { withFileTypes: true })) {
    if (dirent.name.startsWith('.')) continue
    if (dirent.isDirectory()) {
      files.push(...listPublicDir(dirent.name))
      continue
    }
    files.push(dir ? `${dir}/${dirent.name}` : dirent.name)
  }

  return files
}

if (types.includes('env')) {
  try {
    if (stdout.isTTY) stdout.write('Generating environment types...')

    const content = `declare global {
  type PublicFile = ${listPublicDir()
    .map(file => `'/${file}'`)
    .join(' | ')}
}

declare module 'lucide-react' {
  export * from 'lucide-react/dist/lucide-react.suffixed'
}

export {}`

    writeFileSync(ENV_DTS, content, 'utf-8')

    clearLine()
    console.info(`${green('✓')} Environment types generated successfully`)
  } catch {
    clearLine()
    console.error(`${red('✗')} Failed to write ${ENV_DTS}`)
  }
}

if (types.includes('routes')) {
  try {
    if (stdout.isTTY) stdout.write('Generating route types...')
    execSync('next typegen', {
      stdio: stdout.isTTY ? 'ignore' : 'inherit',
      env: { ...process.env, SKIP_ENV_VALIDATION: '1' },
    })
    clearLine()

    const missingTypes = NEXT_DTS.filter(file => !existsSync(file))

    if (missingTypes.length > 0) {
      throw new Error(`Expected type declaration files not found: ${missingTypes.join(', ')}`)
    }

    console.info(`${green('✓')} Route types generated successfully\n`)
  } catch (e) {
    clearLine()
    console.error(`${red('✗')} Failed to generate route types\n`)
    if (e instanceof Error) console.error(red(e.message))
    process.exit(1)
  }
}
