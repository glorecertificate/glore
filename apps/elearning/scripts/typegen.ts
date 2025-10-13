import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

import nextEnv from '@next/env'

const SUPABASE_TYPES = 'supabase/types.d.ts'
const SUPABASE_PROJECT_REGEX = /https:\/\/([a-z0-9]+)\.supabase\.co/

const { loadedEnvFiles } = nextEnv.loadEnvConfig('.')

console.info('Generating environment types...')

const lines = []
const keys = new Set()

for (const { env } of loadedEnvFiles) {
  for (const [key, value] of Object.entries(env)) {
    if (keys.has(key)) continue
    lines.push(`      /** ${value} */`)
    lines.push(`      ${key}: string`)
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

try {
  writeFileSync('env.d.ts', content, 'utf-8')
  console.info('✓ Env types generated successfully')
} catch {
  console.error('✗ Failed to write env.d.ts')
}

const supabaseProjectID = process.env.SUPABASE_URL?.match(SUPABASE_PROJECT_REGEX)?.[1]

try {
  console.info('Generating database types...')
  if (!supabaseProjectID) {
    console.error('✗ SUPABASE_URL is not defined or invalid')
    process.exit(1)
  }
  execSync(`supabase gen types typescript --project-id ${supabaseProjectID} > ${SUPABASE_TYPES}`, { stdio: 'inherit' })
  console.info('✓ Database types generated successfully')
} catch {
  console.error('✗ Failed to generate Supabase types')
  process.exit(1)
}

try {
  execSync('next typegen', { stdio: 'inherit' })
} catch {
  process.exit(1)
}
