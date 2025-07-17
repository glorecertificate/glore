import { type Options as PrettierOptions } from 'prettier'

export enum RuleSeverity {
  Off = 0,
  Warn = 1,
  Error = 2,
}

export type ConfigFiles = Array<string | string[]> | undefined

export type RestrictedImport =
  | string
  | ({
      files?: string[]
    } & (
      | {
          group: string[]
          importNames?: string[]
          message?: string
        }
      | {
          regex: string
          message?: string
        }
    ))

export type ScopedRestrictedImport = Exclude<RestrictedImport, string> & {
  ignores?: string[]
}

export interface SortImportGroup {
  type: Record<string, Array<string | RegExp>>
  value: Record<string, Array<string | RegExp>>
}

export type RelativeImportsValue = 'always' | 'never' | 'siblings'

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
   *
   * @default true
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
  allowRelativeImports?: RelativeImportsValue | [RelativeImportsValue, Partial<Record<RelativeImportsValue, string[]>>]
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
  importGroups?: Array<string | string[]>
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
  /**
   * Specifies the path to the TypeScript configuration file.
   *
   * @default "./tsconfig.json"
   */
  tsconfig?: string
}

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
   * @default false
   */
  newlineAfterImport?: boolean
  /**
   * Whether to preserve or automatically remove unused imports.
   *
   * @default true
   */
  removeUnusedImports?: boolean
}

export interface ConfigOptions extends FileOptions, ImportOptions {
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
  rules?: Record<string, RuleSeverity>
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
   * Whether to sort TypeScript interfaces, or a pattern of files to sort.
   *
   * @default true
   */
  sortInterfaces?: boolean
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
  tailwind?: {
    /**
     * Path to the entry file of the CSS-based configuration.
     * In v3 and older versions, set this value to `null` and specify `tailwindConfig` instead.
     *
     * @default "src/app/globals.css"
     */
    entryPoint: string | null
    /**
     * In v3 and older versions, path to the `tailwind.config[jt]s` file.
     */
    tailwindConfig?: string
    /**
     * Name of the attributes containing the Tailwind classes.
     *
     * @default ["class", "className"]
     */
    attributes?: string[]
    /**
     * List of function names to include.
     *
     * @default ["cc", "clb", "clsx", "cn", "cnb", "ctl", "cva", "cx", "dcnb", "objstr", "tv", "twJoin", "twMerge"]
     */
    callees?: string[]
    /**
     * List of variables to include.
     *
     * @default ["className", "classNames", "classes", "style", "styles"]
     */
    variables?: string[]
    /**
     * List of template literal tag names to include.
     */
    tags?: string[]
    /**
     * List of additional classes that are not defined in the Tailwind configuration.
     *
     * @default ["^group(?:\\/(\\S*))?$", "^peer(?:\\/(\\S*))?$"]
     */
    allowedClasses?: string[]
  }
  /**
   * Whether to use the Turborepo ESLint plugin.
   * @see {@link https://turborepo.com/docs/reference/eslint-plugin-turbo}
   *
   * @default true
   */
  turbo?: boolean
  /**
   * Whether to apply type checking to TypeScript files.
   *
   * @default true
   */
  typecheck?: boolean | 'strict'
}
