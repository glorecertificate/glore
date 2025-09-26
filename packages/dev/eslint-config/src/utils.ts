import { basename } from 'node:path'

import { type Linter } from 'eslint'

import {
  type FileOptions,
  type NoRestrictedImportOptions,
  type RestrictedImport,
  type SortImportGroup,
  type SortImportsOptions,
} from './types'

const IMPORT_GROUPS = [
  'builtin-type',
  'builtin',
  'external-type',
  'external',
  'index-type',
  'index',
  'internal-type',
  'internal',
  'object',
  'parent-type',
  'parent',
  'sibling-type',
  'sibling',
  'side-effect-style',
  'side-effect',
  'style',
  'unknown',
]

const CUSTOM_IMPORT_GROUPS = ['custom-external', 'custom-internal', 'custom-side-effect']

/**
 * Option for files to be included.
 */
export const parseFiles = (options: FileOptions) => {
  const { ignoreJs, ignoreTs, includeDotfiles, includeRoot, includes = [], react } = options
  if (ignoreJs && ignoreTs) return []

  const prefixes = []
  if (!ignoreJs) prefixes.push('j')
  if (!ignoreTs) prefixes.push('t')

  const extension = `[${prefixes.join('')}]s${react ? '?(x)' : ''}`
  const files = [`**/*.${extension}`]

  if (includeDotfiles) files.push(`**/.*.${extension}`)
  if (includeRoot) {
    files.push(`*.${extension}`)
    if (includeDotfiles) files.push(`.*.${extension}`)
  }

  return [...new Set([...files, ...includes])].sort()
}

/**
 * Options for JSX files to be included.
 */
export const parseJsxFiles = (options: FileOptions) => parseFiles({ ...options, react: true })

/**
 * Options for configuration files to be included.
 */
export const parseConfigFiles = (options: FileOptions) => {
  const { ignoreJs, ignoreTs } = options
  if (ignoreJs && ignoreTs) return []

  const prefixes = []
  if (!ignoreJs) prefixes.push('j')
  if (!ignoreTs) prefixes.push('t')

  return prefixes.length === 1 ? [`*.config.${prefixes[0]}s`] : [`*.config.[${prefixes.join('')}]s`]
}

/**
 * Builds import options for the `no-restricted-imports` rule using custom imports.
 *
 * @see {@link https://eslint.org/docs/rules/no-restricted-imports}
 */
export const noRestrictedImports = (
  options: Omit<NoRestrictedImportOptions, 'restrictedImports'> & {
    restrictedImports?: Omit<Exclude<RestrictedImport, string>, 'ignoreFiles'>[]
    severity?: Linter.RuleSeverity
    typescript?: boolean
  } = {},
) => {
  const {
    allowRelativeImports,
    namedImports = [],
    restrictedImports = [],
    severity = 'error',
    typescript = true,
  } = options

  const key = typescript ? '@typescript-eslint/no-restricted-imports' : 'no-restricted-imports'

  const value = {
    paths: namedImports.map(name => ({
      importNames: ['default'],
      message: 'Use named imports instead.',
      name,
    })),
    patterns: [] as Omit<RestrictedImport, 'ignoreFiles'>[],
  }

  const group = []

  if (allowRelativeImports === 'never') group.push('./**/*', '../**/*')
  if (allowRelativeImports === 'siblings') group.push('../**/*')

  if (allowRelativeImports === 'never')
    value.patterns.push({
      group: ['./**/*', '../**/*'],
      message: 'Relative imports are not allowed, use path aliases instead.',
    })
  if (allowRelativeImports === 'siblings')
    value.patterns.push({
      group: ['../**/*'],
      message: 'Parent imports are not allowed, use path aliases instead.',
    })

  if (restrictedImports.length)
    value.patterns.push(
      ...restrictedImports.map(({ caseSensitive = true, ...options }) => ({
        ...(typescript
          ? {
              allowTypeImports: options.allowTypeImports ?? false,
            }
          : {}),
        caseSensitive,
        ...options,
      })),
    )

  return {
    [key]: [severity, value],
  } as Linter.RulesRecord
}

/**
 * Builds import options for the `perfectionist/sort-imports` rule using custom import groups.
 *
 * @see {@link https://perfectionist.dev/rules/sort-imports}
 */
export const sortImportsOptions = (
  options: SortImportsOptions & {
    tsconfig?: string
  },
) => {
  const {
    customExternalImports = [],
    customInternalImports = [],
    customSideEffectImports = [],
    importGroups: groups = [],
    internalImports = [],
    newlinesBetweenGroups: newlinesBetween = 'always',
    tsconfig,
  } = options ?? {}

  const customGroups =
    groups.length > 0
      ? groups.flat().reduce<SortImportGroup>((groups, group) => {
          if (IMPORT_GROUPS.includes(group)) return groups

          if (CUSTOM_IMPORT_GROUPS.includes(group)) {
            const imports =
              group === 'custom-external'
                ? customExternalImports
                : group === 'custom-internal'
                  ? customInternalImports
                  : customSideEffectImports
            const patterns = imports.map(parseImportPatterns).flat()
            return parseImportGroups(groups, group, patterns)
          }

          const patterns = parseImportPatterns(group)
          return parseImportGroups(groups, group, patterns)
        }, {} as SortImportGroup)
      : undefined

  const internalPattern = internalImports.map(pattern => `^${pattern.replace(/\*/g, '.*')}/?.*`)

  const rootDir = tsconfig?.split('/').slice(0, -1).join('/') ?? '.'
  const filename = tsconfig ? basename(tsconfig) : 'tsconfig.json'

  return {
    customGroups,
    groups,
    internalPattern,
    newlinesBetween,
    tsconfig: {
      rootDir,
      filename,
    },
  }
}

const parseImportPatterns = (entry: string | string[]): string[] => {
  if (Array.isArray(entry)) return entry.map(parseImportPatterns).flat()
  const name = entry.replace(/\*/g, '.*')
  return [`^${name}$`, `^${name}/.+`]
}

const parseImportGroups = (groups: SortImportGroup, group: string, patterns: string[]) => ({
  type: { ...groups?.type, [group]: patterns },
  value: { ...groups?.value, [group]: patterns },
})
