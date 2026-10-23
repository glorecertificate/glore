import { parseArgs } from 'node:util'

const LOCAL_DATABASE_REGEX = /@(localhost|127\.0\.0\.1)(:|\/)/u

const TARGETS = ['local', 'staging', 'production'] as const

export type Target = (typeof TARGETS)[number]

interface ParsedArgs {
  dryRun: boolean
  error?: string
  includeOutdated: boolean
  target?: Target
}

const EMPTY = { dryRun: false, includeOutdated: false }

export const parseTargetArgs = (
  argv: string[],
  flags: readonly ('dry-run' | 'include-outdated')[] = []
): ParsedArgs => {
  try {
    const { values } = parseArgs({
      args: argv,
      options: {
        'dry-run': { type: 'boolean' },
        'include-outdated': { type: 'boolean' },
        target: { type: 'string' },
      },
      strict: true,
    })
    const rejected = (['dry-run', 'include-outdated'] as const).find(flag => values[flag] && !flags.includes(flag))
    if (rejected) return { ...EMPTY, error: `--${rejected} is not supported here` }
    const target = TARGETS.find(name => name === values.target)
    if (!target) return { ...EMPTY, error: `--target must be one of ${TARGETS.join(', ')}` }
    return {
      dryRun: Boolean(values['dry-run']),
      includeOutdated: Boolean(values['include-outdated']),
      target,
    }
  } catch (e) {
    return { ...EMPTY, error: (e as Error).message }
  }
}

export const guardTarget = (target: Target, databaseUrl: string | undefined) => {
  if (!databaseUrl) return 'DATABASE_URL is not set'
  const isLocal = LOCAL_DATABASE_REGEX.test(databaseUrl)
  if (target === 'local' && !isLocal) {
    return 'Refusing to read: --target local needs a DATABASE_URL on localhost or 127.0.0.1.'
  }
  if (target !== 'local' && isLocal) {
    return `Refusing to read: --target ${target} needs a DATABASE_URL that is not local.`
  }
  return null
}
