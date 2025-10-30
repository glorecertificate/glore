import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { stdout } from 'node:process'

import nextEnv from '@next/env'

import { logger } from '@glore/utils/logger'

const { loadedEnvFiles } = nextEnv.loadEnvConfig('.')

const outputs = {
  env: resolve('env.d.ts'),
  global: resolve('global.d.ts'),
  supabase: resolve('supabase/types.ts'),
}

const logOptions = {
  replace: stdout.isTTY,
}

try {
  logger.inline('Generating global types...')

  const content = `declare module 'lucide-react' {
  export * from 'lucide-react/dist/lucide-react.suffixed'
}`

  writeFileSync(outputs.global, content, 'utf-8')

  logger.success('Global types generated successfully', logOptions)
} catch {
  logger.error('Failed to write global.d.ts', logOptions)
}

try {
  logger.inline('Generating environment types...')

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
  logger.inline('Generating database types...')

  const supabaseProjectID = process.env.SUPABASE_URL?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]

  if (!supabaseProjectID) {
    throw new Error('SUPABASE_URL is not defined or invalid')
  }

  execSync(
    `./node_modules/.bin/supabase gen types typescript --project-id ${supabaseProjectID} > ${outputs.supabase}`,
    {
      stdio: 'ignore',
    }
  )

  execSync(`./node_modules/.bin/biome check --fix ${outputs.supabase}`, { stdio: 'ignore' })

  logger.success('Database types generated successfully', logOptions)
} catch (e) {
  logger.error('Failed to generate Supabase types', logOptions)
  if (e instanceof Error) logger.red(e.message)
  process.exit(1)
}

try {
  logger.inline('Generating route types...')
  execSync('./node_modules/.bin/next typegen', { stdio: 'ignore' })
  logger.success('Route types generated successfully', logOptions)
} catch (e) {
  logger.error('Failed to generate route types', logOptions)
  if (e instanceof Error) logger.red(e.message)
  process.exit(1)
}
