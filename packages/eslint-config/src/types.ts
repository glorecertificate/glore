import { type Options as PrettierOptions } from 'prettier'

/**
 * Severity levels for ESLint rules.
 */
export enum RuleSeverity {
  Off = 'off',
  Warn = 'warn',
  Error = 'error',
}

/**
 * File patterns to include in the ESLint configuration.
 */
export type ConfigFiles = (string | string[])[] | undefined

/**
 * Type for restricted imports in ESLint configuration.
 */
export type RestrictedImport =
  | string
  | ({
      /**
       * Sets the patterns specified in the group or regex properties to be case-sensitive.
       *
       * @default true
       */
      caseSensitive?: boolean
      /**
       * Specifies the names of specific imports to restrict.
       * Using "default" will restrict the default export from being imported.
       */
      importNames?: string[]
      /**
       * Specifies the names of imports that are allowed.
       */
      allowImportNames?: string[]
      /**
       * Specifies a regex pattern for restricting modules.
       */
      importNamePattern?: string
      /**
       * Specifies a regex pattern for allowing imports.
       */
      allowImportNamePattern?: string
      /**
       * Files to ignore for this restriction.
       */
      ignoreFiles?: string[]
      /**
       * Custom message to append to the default error message from the rule.
       */
      message?: string
    } & (
      | {
          /** Specifies the gitignore-style patterns for restricting modules. */
          group: string[]
        }
      | {
          /** Specifies the regex patterns for restricting modules. */
          regex: string
        }
    ))

/**
 * Type for defining import sorting groups in ESLint configuration.
 */
export interface SortImportGroup {
  type: Record<string, (string | RegExp)[]>
  value: Record<string, (string | RegExp)[]>
}

/**
 * Type for relative import settings in ESLint configuration.
 */
export type RelativeImportValue = 'always' | 'never' | 'siblings'

/**
 * Options for configuring file handling in ESLint configuration.
 */
export interface FileOptions {
  /**
   * Patterns of files to lint.
   */
  files?: ConfigFiles
  /**
   * Whether to ignore JavaScript files.
   *
   * @default false
   */
  ignoreJs?: boolean
  /**
   * Patterns of files and folders to ignore.
   */
  ignores?: string[]
  /**
   * Whether to ignore TypeScript files.
   *
   * @default false
   */
  ignoreTs?: boolean
  /**
   * Whether to lint files starting with a dot.
   *
   * @default false
   */
  includeDotfiles?: boolean
  /**
   * When using a monorepo, whether to include the root directory.
   *
   * @default true
   */
  includeRoot?: boolean
  /**
   * Patterns of additional files to include.
   */
  includes?: string[]
  /**
   * Whether to include the React configuration and use Next.js.
   *
   * @default false
   */
  react?: boolean | 'nextjs'
}

/**
 * Options for configuring restricted imports in ESLint configuration.
 */
export interface NoRestrictedImportOptions {
  /**
   * Controls when relative imports are allowed.
   *
   * - `always`: Allow all relative imports
   * - `never`: Disallow all relative imports
   * - `siblings`: Only allow relative imports between sibling files
   *
   * When using an array, the first element sets the default behavior
   * and the second element specifies file-specific overrides.
   *
   * @default "siblings"
   *
   * @example
   * Allow relative imports between sibling files, but disallow all others:
   * ```
   * allowRelativeImports: ['siblings', {
   *   always: ['src/components/**'],
   *   never: ['src/utils/**'],
   * }]
   * ```
   * Disallow all relative imports:
   * ```
   * allowRelativeImports: 'never'
   * ```
   */
  allowRelativeImports?: RelativeImportValue | [RelativeImportValue, Partial<Record<RelativeImportValue, string[]>>]
  /**
   * Modules that don't allow default imports.
   */
  namedImports?: string[]
  /**
   * Whether to use the `node:` prefix for built-in modules.
   *
   * @default "always"
   */
  nodePrefix?: 'always' | 'never' | 'ignore'
  /**
   * Groups of modules that are restricted from being imported.
   */
  restrictedImports?: RestrictedImport[]
}

/**
 * Options for configuring import sorting in ESLint configuration.
 */
export interface SortImportsOptions {
  /**
   * Imports that will be placed at the bottom of the block.
   */
  bottomImports?: string[]
  /**
   * External exports placed above the default external group.
   */
  customExternalImports?: string[]
  /**
   * Internal imports placed above the default internal group.
   */
  customInternalImports?: string[]
  /**
   * Allows to specify a list of import groups for sorting. Groups can be package names.
   *
   * @see {@link https://perfectionist.dev/rules/sort-imports#groups}
   *
   * @default
   * [
   *   ["side-effect", "side-effect-style"],
   *   "builtin",
   *   "custom-external",
   *   "external",
   *   "custom-internal",
   *   "internal",
   *   ["parent", "index", "sibling"],
   *   "bottom"
   * ]
   */
  importGroups?: (string | string[])[]
  /**
   * List of internal imports to match.
   */
  internalImports?: string[]
  /**
   * Whether to add newlines between import groups.
   *
   * @default "always"
   */
  newlinesBetweenGroups?: 'always' | 'never' | 'ignore'
}

/**
 * Options for configuring import handling in ESLint configuration.
 */
export interface ImportOptions extends NoRestrictedImportOptions, SortImportsOptions {
  /**
   * Whether to force placing exports at the end of the file.
   *
   * @default false
   */
  exportLast?: boolean
  /**
   * Whether to add a newline after the import block.
   *
   * @default true
   */
  newlineAfterImport?: boolean
  /**
   * Whether to preserve or automatically remove unused imports.
   *
   * @default true
   */
  removeUnusedImports?: boolean
}

/**
 * Tailwind CSS configuration options.
 *
 * @see {@link https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/settings/settings.md|`eslint-plugin-better-tailwindcss`}
 */
export interface TailwindOptions {
  /**
   * List of additional classes that are not defined in the Tailwind configuration.
   *
   * @default ["dark", "^group(?:\\/(\\S*))?$", "^peer(?:\\/(\\S*))?$"]
   */
  allowedClasses?: string[]
  /**
   * Name of the attributes containing the Tailwind classes.
   *
   * @default ["class", "className", ".*ClassName"]
   */
  attributes?: string[]
  /**
   * List of function names to include.
   *
   * @default ["cc", "clb", "clsx", "cn", "cnb", "ctl", "cva", "cx", "dcnb", "objstr", "tv", "twJoin", "twMerge"]
   */
  callees?: string[]
  /**
   * Path to the entry file of the CSS-based configuration.
   * In v3 and older versions, set this value to `null` and specify `tailwindConfig` instead.
   *
   * @default "./src/app/globals.css"
   */
  entryPoint?: string | null
  /**
   * Maximum line length for Tailwind classes.
   *
   * @default 140
   */
  printWidth?: number
  /**
   * List of template literal tag names to include.
   */
  tags?: string[]
  /**
   * In v3 and older versions, path to the `tailwind.config[jt]s` file.
   */
  tailwindConfig?: string
  /**
   * List of variables to include.
   *
   * @default ["className", "classNames", "classes", "style", "styles"]
   */
  variables?: string[]
}

/**
 * TypeScript-specific options for ESLint configuration.
 */
export interface TypescriptOptions {
  /**
   * Whether to avoid running type-aware rules in development.
   *
   * @default false
   */
  optimizeTypedRules?: boolean
  /**
   * Whether to sort TypeScript interfaces, or a pattern of files to sort.
   *
   * @default true
   */
  sortInterfaces?: boolean
  /**
   * Specifies the path to the TypeScript configuration file.
   *
   * @default "./tsconfig.json"
   */
  tsconfig?: string
  /**
   * Whether to apply type checking to TypeScript files.
   *
   * @default true
   */
  typeCheck?: boolean | 'strict'
}

/**
 * Available options for the ESLint configuration.
 */
export interface Options extends FileOptions, ImportOptions, TypescriptOptions {
  /**
   * Whether to add a newline after the return statement.
   *
   * @default true
   */
  emptyLineAfterReturn?: boolean
  /**
   * Maximum number of lines per file. Use `-1` to disable.
   *
   * @default 300
   */
  maxLines?: number
  /**
   * Whether to prefer arrow functions over function expressions.
   *
   * @default true
   */
  preferArrow?: boolean
  /**
   * Whether to use a Prettier configuration file, or a list of options.
   *
   * @default true
   */
  prettier?: boolean | PrettierOptions
  /**
   * Files to lint with Prettier. Defaults to all files included in the ESLint configuration.
   */
  prettierIncludes?: string[]
  /**
   * Additional rules to apply to the ESLint configuration.
   */
  rules?: Record<
    string,
    RuleSeverity | `${RuleSeverity}` | [RuleSeverity | `${RuleSeverity}`, Record<string | number | symbol, any> | any[]]
  >
  /**
   * Whether to sort array values, or a pattern of files to sort.
   *
   * @default true
   */
  sortArrays?: boolean | string[]
  /**
   * Whether to sort destructured objects, or a pattern of files to sort.
   *
   * @default true
   */
  sortDestructuredKeys?: boolean | string[]
  /**
   * Whether to sort object keys, or a pattern of files to sort.
   *
   * @default true
   */
  sortObjectKeys?: boolean | string[]
  /**
   * Whether to sort props in React components. Only applies when using the React configuration.
   *
   * @default true
   */
  sortProps?: boolean
  /**
   * Tailwind CSS configuration options. If not specified, the plugin will not be loaded.
   *
   * @see {@link https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/settings/settings.md|`eslint-plugin-better-tailwindcss`}
   */
  tailwind?: TailwindOptions
  /**
   * Whether to use the Turborepo ESLint plugin.
   *
   * @see {@link https://turborepo.com/docs/reference/eslint-plugin-turbo|`eslint-plugin-turbo`}
   * @default true
   */
  turbo?: boolean
}
