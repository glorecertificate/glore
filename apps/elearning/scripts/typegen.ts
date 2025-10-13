import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import nextEnv from '@next/env'

const ENV_TYPES = 'env.d.ts'
const SUPABASE_TYPES = 'supabase/types.d.ts'
const SUPABASE_PROJECT_REGEX = /https:\/\/([a-z0-9]+)\.supabase\.co/

try {
  console.info('Generating environment types...')

  const { loadedEnvFiles } = nextEnv.loadEnvConfig('.')

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

  writeFileSync(ENV_TYPES, content, 'utf-8')

  console.info('✓ Env types generated successfully')
} catch {
  console.error('✗ Failed to write env.d.ts')
}

try {
  console.info('Generating database types...')

  const supabaseProjectID = process.env.SUPABASE_URL?.match(SUPABASE_PROJECT_REGEX)?.[1]

  if (!supabaseProjectID) {
    console.error('✗ SUPABASE_URL is not defined or invalid')
    process.exit(1)
  }

  execSync(
    `./node_modules/.bin/supabase gen types typescript --project-id ${supabaseProjectID} > ${resolve(SUPABASE_TYPES)}`,
    {
      stdio: 'inherit',
    }
  )

  console.info('✓ Database types generated successfully')
} catch {
  console.error('✗ Failed to generate Supabase types')
  process.exit(1)
}

try {
  execSync('./node_modules/.bin/next typegen', { stdio: 'inherit' })
} catch {
  process.exit(1)
}
