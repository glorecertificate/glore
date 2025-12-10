import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

import { logger } from '@glore/utils/logger'
import nextEnv from '@next/env'
import { Argument, Command } from 'commander'

import { cli } from '../config'

const ARGS = ['env', 'global', 'routes', 'supabase'] as const
const SUPABASE_PROJECT_REGEX = /https:\/\/([a-z0-9]+)\.supabase\.co/

export const typegen = new Command('typegen')
  .description('Generate global types for the project')
  .addArgument(new Argument('[types...]', 'types to generate').choices(ARGS))
  .option('-g, --global <path>', 'path to output the generated global types', './global.d.ts')
  .option('-e, --env <path>', 'path to output the generated env types', './env.d.ts')
  .option('-s, --supabase <path>', 'path to output the generated Supabase types', './supabase/types.ts')
  .action((args, { env, global, supabase }) => {
    const types = args && args.length > 0 ? args : ARGS

    if (types.includes('global')) {
      try {
        logger.inline('Generating global types...')

        const content = `declare module 'lucide-react' {
  export * from 'lucide-react/dist/lucide-react.suffixed'
}`

        writeFileSync(global, content, 'utf-8')

        logger.success('Global types generated successfully', cli.logOptions)
      } catch {
        logger.error('Failed to write global types', cli.logOptions)
      }
    }

    if (types.includes('env')) {
      try {
        logger.inline('Generating environment types...')

        const lines = []
        const keys = new Set()

        const { loadedEnvFiles } = nextEnv.loadEnvConfig('.')

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

        writeFileSync(env, content, 'utf-8')

        logger.success('Env types generated successfully', cli.logOptions)
      } catch {
        logger.error('Failed to write env.d.ts', cli.logOptions)
      }
    }

    if (types.includes('routes')) {
      try {
        logger.inline('Generating route types...')
        execSync(`${cli.bin('next')} typegen`, { stdio: 'ignore' })
        logger.success('Route types generated successfully', cli.logOptions)
      } catch (e) {
        logger.error('Failed to generate route types', cli.logOptions)
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

        execSync(`${cli.bin('supabase')} gen types typescript --project-id ${supabaseProjectID} > ${supabase}`, {
          stdio: 'ignore',
        })

        logger.success('Database types generated successfully', cli.logOptions)
      } catch (e) {
        logger.error('Failed to generate Supabase types', cli.logOptions)
        if (e instanceof Error) logger.red(e.message)
        process.exit(1)
      }
    }
  })
