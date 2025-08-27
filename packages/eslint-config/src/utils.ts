import { builtinModules } from 'node:module'
import { basename } from 'node:path'

import type {
  FileOptions,
  NoRestrictedImportOptions,
  RestrictedImport,
  SortImportGroup,
  SortImportsOptions,
} from './types'

const DEFAULT_IMPORT_GROUPS = Object.freeze([
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
])

const CUSTOM_IMPORT_GROUPS = Object.freeze(['custom-external', 'custom-internal', 'bottom'])

/**
 * Option for files to be included.
 */
export const fileOptions = (options: FileOptions) => {
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
export const jsxFileOptions = (options: FileOptions) => fileOptions({ ...options, react: true })

/**
 * Options for configuration files to be included.
 */
export const configFileOptions = (options: FileOptions) => {
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
export const noRestrictedImportsOptions = (
  options: Omit<NoRestrictedImportOptions, 'restrictedImports'> & {
    restrictedImports?: Omit<Exclude<RestrictedImport, string>, 'ignoreFiles'>[]
  } = {},
) => {
  const { allowRelativeImports, namedImports = [], nodePrefix, restrictedImports = [] } = options

  const rule = {
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
    rule.patterns.push({
      group: ['./**/*', '../**/*'],
      message: 'Relative imports are not allowed, use path aliases instead.',
    })
  if (allowRelativeImports === 'siblings')
    rule.patterns.push({
      group: ['../**/*'],
      message: 'Parent imports are not allowed, use path aliases instead.',
    })

  if (restrictedImports.length)
    rule.patterns.push(
      ...restrictedImports.map(({ caseSensitive = true, ...pattern }) => ({
        ...pattern,
        caseSensitive,
      })),
    )

  if (nodePrefix === 'never')
    rule.patterns.push({
      group: ['node:*', 'node:*/**/*'],
      message: "Do not use the 'node:' prefix for built-in modules.",
    })
  if (nodePrefix === 'always')
    rule.patterns.push({
      group: builtinModules
        .filter(name => !name.includes('constants'))
        .map(name => [name, `${name}/**/*`])
        .flat(),
      message: "Use the 'node:' prefix for built-in modules.",
    })

  return rule
}

/**
 * Builds import options for the `perfectionist/sort-imports` rule using custom import groups.
 *
 * @see {@link https://perfectionist.dev/rules/sort-imports}
 */
export const sortImportsOptions = (
  options: SortImportsOptions & {
    tsconfig?: string
  } = {},
) => {
  const {
    bottomImports = [],
    customExternalImports = [],
    customInternalImports = [],
    importGroups: groups = [],
    internalImports = [],
    newlinesBetweenGroups: newlinesBetween = 'always',
    tsconfig = './tsconfig.json',
  } = options

  const customGroups =
    groups.length > 0
      ? groups.flat().reduce<SortImportGroup>((groups, group) => {
          if (DEFAULT_IMPORT_GROUPS.includes(group)) return groups

          if (CUSTOM_IMPORT_GROUPS.includes(group)) {
            const imports =
              group === 'bottom'
                ? bottomImports
                : group === 'custom-external'
                  ? customExternalImports
                  : customInternalImports
            const patterns = imports.map(buildPatterns).flat()
            return defineGroups(groups, group, patterns)
          }

          const patterns = buildPatterns(group)
          return defineGroups(groups, group, patterns)
        }, {} as SortImportGroup)
      : undefined

  const internalPattern = internalImports.map(pattern => `^${pattern.replace(/\*/g, '.*')}/?.*`)

  const rootDir = tsconfig.split('/').slice(0, -1).join('/')
  const filename = basename(tsconfig)

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

const buildPatterns = (entry: string | string[]): string[] => {
  if (Array.isArray(entry)) return entry.map(buildPatterns).flat()
  const name = entry.replace(/\*/g, '.*')
  return [`^${name}$`, `^${name}/.+`]
}

const defineGroups = (groups: SortImportGroup, group: string, patterns: string[]) => ({
  type: { ...groups?.type, [group]: patterns },
  value: { ...groups?.value, [group]: patterns },
})
