import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { stdout } from 'node:process'

import nextEnv from '@next/env'

import { logger } from './logger'

const { loadedEnvFiles } = nextEnv.loadEnvConfig('.')

const outputs = {
  env: resolve('env.d.ts'),
  supabase: resolve('supabase/types.ts'),
}

const logOptions = {
  replace: stdout.isTTY,
}

try {
  if (stdout.isTTY) logger('Generating environment types...')

  const lines = []
  const keys = new Set()

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

  writeFileSync(outputs.env, content, 'utf-8')

  logger.success('Env types generated successfully', logOptions)
} catch {
  logger.error('Failed to write env.d.ts', logOptions)
}

try {
  if (stdout.isTTY) logger('Generating database types...')

  const supabaseProjectID = process.env.SUPABASE_URL?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]

  if (!supabaseProjectID) {
    console.error('✗ SUPABASE_URL is not defined or invalid')
    process.exit(1)
  }

  execSync(
    `./node_modules/.bin/supabase gen types typescript --project-id ${supabaseProjectID} > ${outputs.supabase}`,
    {
      stdio: 'inherit',
    }
  )

  logger.success('Database types generated successfully', logOptions)
} catch {
  logger.error('Failed to generate Supabase types', logOptions)
  process.exit(1)
}

try {
  if (stdout.isTTY) logger('Generating route types...')
  execSync('./node_modules/.bin/next typegen', { stdio: 'ignore' })
  logger.success('Route types generated successfully', logOptions)
} catch {
  logger.error('Failed to generate route types', logOptions)
  process.exit(1)
}
