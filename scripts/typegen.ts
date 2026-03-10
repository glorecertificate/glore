#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import { readdirSync, writeFileSync } from 'node:fs'
import { stdout } from 'node:process'

import { loadEnvConfig } from '@next/env'

const ARGS = ['env', 'routes'] as const
const ENV_DTS = './env.d.ts'

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
    stdout.write('Generating environment types...')

    const lines = []
    const keys = new Set()

    for (const { env, path } of loadEnvConfig('.').loadedEnvFiles) {
      for (const [key, value] of Object.entries(env)) {
        if (keys.has(key)) continue
        lines.push('      /**')
        lines.push(`       * Loaded from \`${path}\``)
        lines.push('       *')
        lines.push(`       * ${value || '*Empty*'}`)
        lines.push('       */')
        lines.push(`      ${key}${value ? '' : '?'}: string`)
        keys.add(key)
      }
    }

    const content = `declare global {
  namespace NodeJS {
    interface ProcessEnv {
${lines.join('\n')}
    }
  }

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
    console.info(`${green('✓ ')} Environment types generated successfully`)
  } catch {
    clearLine()
    console.error(`${red('✗ ')} Failed to write ${ENV_DTS}`)
  }
}

if (types.includes('routes')) {
  try {
    stdout.write('Generating route types...')
    execSync('next typegen', { stdio: 'ignore' })
    clearLine()
    console.info(`${green('✓ ')} Route types generated successfully\n`)
  } catch (e) {
    clearLine()
    console.error(`${red('✗ ')} Failed to generate route types\n`)
    if (e instanceof Error) console.error(red(e.message))
    process.exit(1)
  }
}
