import { parseArgs } from 'node:util'

import { LOCAL_DATABASE_REGEX } from './config.mts'

const TARGETS = ['local', 'staging', 'production'] as const

type Target = (typeof TARGETS)[number]

export interface ImportOptions {
  target: Target
  drafts: boolean
  examples: boolean
  dryRun: boolean
  remove: string[]
}

export const USAGE = `Usage: pnpm run content:import --target <local|staging|production> [--drafts] [--examples] [--dry-run] [--remove <slug>]`

export const parseImportArgs = (argv: string[]) => {
  try {
    const { values } = parseArgs({
      args: argv,
      options: {
        'dry-run': { type: 'boolean' },
        drafts: { type: 'boolean' },
        examples: { type: 'boolean' },
        remove: { multiple: true, type: 'string' },
        target: { type: 'string' },
      },
      strict: true,
    })
    const target = TARGETS.find(name => name === values.target)
    if (!target) return { drafts: false, error: `--target must be one of ${TARGETS.join(', ')}` }
    const options: ImportOptions = {
      drafts: values.drafts ?? false,
      dryRun: values['dry-run'] ?? false,
      examples: values.examples ?? false,
      remove: values.remove ?? [],
      target,
    }
    return { options }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

interface Guard {
  drafts: boolean
  error?: string
}

export const guardTarget = (options: ImportOptions, databaseUrl: string | undefined): Guard => {
  if (!databaseUrl) return { drafts: false, error: 'DATABASE_URL is not set' }
  const isLocal = LOCAL_DATABASE_REGEX.test(databaseUrl)
  if (options.target === 'local' && !isLocal) {
    return {
      drafts: false,
      error: 'Refusing to import: --target local needs a DATABASE_URL on localhost or 127.0.0.1.',
    }
  }
  if (options.target !== 'local' && isLocal) {
    return {
      drafts: false,
      error: `Refusing to import: --target ${options.target} needs a DATABASE_URL that is not local.`,
    }
  }
  if (options.target === 'production' && options.remove.length > 0) {
    return { drafts: false, error: 'Refusing to remove courses on production.' }
  }
  if (options.target === 'production' && options.examples) {
    return { drafts: false, error: 'Refusing to import example courses on production.' }
  }
  return { drafts: options.drafts || options.target === 'production' }
}
