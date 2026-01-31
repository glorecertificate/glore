#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import { readdirSync, writeFileSync } from 'node:fs'

import { loadEnvConfig } from '@next/env'

import { logger } from './logger'

const ARGS = ['global', 'routes', 'database'] as const
const GLOBAL_DTS = './global.d.ts'

const SUPABASE_REGEX = /https:\/\/([a-z0-9]+)\.supabase\.co/

const args = process.argv.slice(2)
const types = args && args.length > 0 ? args : ARGS

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

if (types.includes('global')) {
  try {
    logger.inline('Generating global types...')

    const lines = []
    const keys = new Set()
    const { loadedEnvFiles } = loadEnvConfig('.')

    for (const { env, path } of loadedEnvFiles) {
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

    writeFileSync(GLOBAL_DTS, content, 'utf-8')

    logger.success('Global types generated successfully', { clearLine: true })
  } catch (_e) {
    logger.error(`Failed to write ${GLOBAL_DTS}`, { clearLine: true })
  }
}

if (types.includes('routes')) {
  try {
    logger.inline('Generating route types...')
    execSync('next typegen', { stdio: 'ignore' })
    logger.success('Route types generated successfully', { clearLine: true })
  } catch (e) {
    logger.error('Failed to generate route types', { clearLine: true })
    if (e instanceof Error) logger.red(e.message)
    process.exit(1)
  }
}

if (types.includes('database')) {
  try {
    logger.inline('Generating database types...')

    const projectID = process.env.SUPABASE_URL?.match(SUPABASE_REGEX)?.[1]
    if (!projectID) throw new Error('SUPABASE_URL is not valid')

    execSync(`supabase gen types typescript --project-id ${projectID} > ./supabase/types.ts`, {
      stdio: 'ignore',
    })

    logger.success('Database types generated successfully', { clearLine: true })
  } catch (e) {
    logger.error('Failed to generate Supabase types', { clearLine: true })
    if (e instanceof Error) logger.red(e.message)
    process.exit(1)
  }
}
