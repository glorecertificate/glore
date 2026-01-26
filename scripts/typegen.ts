#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

import { loadEnvConfig } from '@next/env'

import { logger } from './logger'

const ARGS = ['env', 'global', 'routes', 'supabase'] as const
const SUPABASE_PROJECT_REGEX = /https:\/\/([a-z0-9]+)\.supabase\.co/

const args = process.argv.slice(2)
const types = args && args.length > 0 ? args : ARGS

if (types.includes('global')) {
  try {
    logger.inline('Generating global types...')

    const content = `declare module 'lucide-react' {
  export * from 'lucide-react/dist/lucide-react.suffixed'
}`

    writeFileSync('./global.d.ts', content, 'utf-8')

    logger.success('Global types generated successfully', { clearLine: true })
  } catch {
    logger.error('Failed to write global types', { clearLine: true })
  }
}

if (types.includes('env')) {
  try {
    logger.inline('Generating environment types...')

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
}
export {}`

    writeFileSync('./env.d.ts', content, 'utf-8')

    logger.success('Env types generated successfully', { clearLine: true })
  } catch {
    logger.error('Failed to write env.d.ts', { clearLine: true })
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

if (types.includes('supabase')) {
  try {
    logger.inline('Generating database types...')

    const supabaseProjectID = process.env.SUPABASE_URL?.match(SUPABASE_PROJECT_REGEX)?.[1]

    if (!supabaseProjectID) {
      throw new Error('SUPABASE_URL is not defined or invalid')
    }

    execSync(`supabase gen types typescript --project-id ${supabaseProjectID} > ./supabase/types.ts`, {
      stdio: 'ignore',
    })

    logger.success('Database types generated successfully', { clearLine: true })
  } catch (e) {
    logger.error('Failed to generate Supabase types', { clearLine: true })
    if (e instanceof Error) logger.red(e.message)
    process.exit(1)
  }
}
