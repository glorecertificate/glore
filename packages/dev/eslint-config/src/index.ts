import { dirname, resolve } from 'node:path'

import eslint from '@eslint/js'
import { type Linter } from 'eslint'
import { defineConfig } from 'eslint/config'

import stylisticPlugin from '@stylistic/eslint-plugin'
import gitignoreConfig from 'eslint-config-flat-gitignore'
import importPlugin from 'eslint-plugin-import'
import perfectionistPlugin from 'eslint-plugin-perfectionist'
import { configs as typescriptConfigs } from 'typescript-eslint'

import { deepmerge } from 'deepmerge-ts'

import { ESLINT_OPTIONS } from './config'
import { type Options, type RestrictedImport } from './types'
import { noRestrictedImports, parseConfigFiles, parseFiles, parseJsxFiles, sortImportsOptions } from './utils'

const BASE_PLUGINS = {
  '@stylistic': stylisticPlugin as any,
  import: importPlugin,
  perfectionist: perfectionistPlugin as any,
}

const BASE_CONFIGS = {
  gitignore: gitignoreConfig,
}

const plugins = {
  ...BASE_PLUGINS,
} as typeof BASE_PLUGINS & {
  // @ts-ignore missing type definitions
  '@next/next': typeof import('@next/eslint-plugin-next').default
  'better-tailwindcss': typeof import('eslint-plugin-better-tailwindcss').default
  'prefer-arrow-functions': typeof import('eslint-plugin-prefer-arrow-functions')
  prettier: typeof import('eslint-plugin-prettier')
  react: typeof import('eslint-plugin-react')
  'react-hooks': typeof import('eslint-plugin-react-hooks')
  // @ts-ignore missing type definitions
  'sort-array-values': typeof import('eslint-plugin-sort-array-values')
  // @ts-ignore missing type definitions
  'sort-destructure-keys': typeof import('eslint-plugin-sort-destructure-keys')
  turbo: typeof import('eslint-plugin-turbo').default
  'unused-imports': typeof import('eslint-plugin-unused-imports').default
}

const configs = {
  ...BASE_CONFIGS,
} as typeof BASE_CONFIGS & {
  prettier: typeof import('eslint-config-prettier')
  prettierRecommended: typeof import('eslint-plugin-prettier/recommended')
  typescriptStylistic: typeof import('typescript-eslint').configs.stylistic
  typescriptTypedRecommended: typeof import('typescript-eslint').configs.recommendedTypeChecked
  typescriptTypedStrict: typeof import('typescript-eslint').configs.strictTypeChecked
}

/**
 * ESLint configuration function.
 */
const eslintConfig = async (options?: Options, ...userConfig: Linter.Config<Linter.RulesRecord>[]) => {
  const {
    allowRelativeImports,
    customExternalImports,
    customInternalImports,
    customSideEffectImports,
    emptyLineAfterReturn,
    exportLast,
    files: userFiles,
    ignoreJs,
    ignoreTs,
    ignores,
    importGroups,
    includeDotfiles,
    includeRoot,
    includes,
    internalImports,
    maxLines,
    namedImports,
    newlineAfterImport,
    newlinesBetweenGroups,
    nodePrefix,
    optimizeTypedRules,
    preferArrow,
    prettier,
    prettierIncludes,
    react,
    removeUnusedImports,
    restrictedImports,
    rules,
    sortArrays,
    sortDestructuredKeys,
    sortExports,
    sortInterfaces,
    sortObjectKeys,
    sortProps,
    tsconfig,
    turbo,
    typeCheck,
  } = { ...ESLINT_OPTIONS, ...(options ?? {}) }

  // Files
  const files = userFiles ?? parseFiles({ ignoreJs, ignoreTs, includes, includeDotfiles, includeRoot, react })
  const jsxFiles = userFiles ?? parseJsxFiles({ ignoreJs, ignoreTs, includeDotfiles, includeRoot })
  const configFiles = parseConfigFiles({ ignoreJs, ignoreTs })
  const prettierFiles = prettierIncludes ?? files

  // Restricted imports
  const restrictedPatterns = restrictedImports.map((pattern, i) =>
    typeof pattern === 'string'
      ? {
          id: i,
          group: [pattern],
        }
      : { id: i, ...pattern },
  )
  const globalRestrictedImports: Omit<Exclude<RestrictedImport, string>, 'ignoreFiles'>[] = restrictedPatterns.map(
    ({ id, ignoreFiles, ...pattern }) => pattern,
  )
  const scopedRestrictedImports: {
    ignores: string[]
    restrictedImports: Omit<Exclude<RestrictedImport, string>, 'ignoreFiles'>[]
  }[] = []

  for (const pattern of restrictedPatterns) {
    if (!pattern.ignoreFiles?.length) continue

    const patterns = restrictedPatterns.filter(({ id }) => id !== pattern.id).map(({ id, ignoreFiles, ...p }) => p)

    scopedRestrictedImports.push({
      ignores: pattern.ignoreFiles,
      restrictedImports: patterns,
    })
  }

  // React
  const hasNextJs = typeof react === 'string' && react === 'nextjs'

  // Typescript
  const tsconfigDir = resolve(tsconfig.includes('/') ? dirname(tsconfig) : process.cwd())
  const typeChecked = typeCheck && (process.env.CI || !optimizeTypedRules) ? typeCheck : false
  const tsSeverity: Linter.RuleSeverity = typeChecked ? 'error' : 'off'

  // Tailwind
  const tailwind = options?.tailwind ? deepmerge(ESLINT_OPTIONS.tailwind, options.tailwind) : false
  const { allowedClasses, printWidth, ...tailwindConfig } = tailwind || {}
  const allowedTailwindClasses = [...(allowedClasses ?? []), '^group(?:\\/(\\S*))?$', '^peer(?:\\/(\\S*))?$']

  // Plugins and configs
  if (preferArrow) plugins['prefer-arrow-functions'] = await import('eslint-plugin-prefer-arrow-functions')
  if (prettier) plugins.prettier = (await import('eslint-plugin-prettier')).default
  if (react) {
    plugins.react = (await import('eslint-plugin-react')).default
    plugins['react-hooks'] = (await import('eslint-plugin-react-hooks')).default
    // @ts-ignore missing type definitions
    if (hasNextJs) plugins['@next/next'] = (await import('@next/eslint-plugin-next')).default
  }
  // @ts-ignore missing type definitions
  if (sortArrays) plugins['sort-array-values'] = (await import('eslint-plugin-sort-array-values')).default
  if (sortDestructuredKeys)
    // @ts-ignore missing type definitions
    plugins['sort-destructure-keys'] = (await import('eslint-plugin-sort-destructure-keys')).default
  if (tailwind) plugins['better-tailwindcss'] = (await import('eslint-plugin-better-tailwindcss')).default
  if (turbo) plugins['turbo'] = (await import('eslint-plugin-turbo')).default
  if (!ignoreTs) {
    configs.typescriptStylistic = typescriptConfigs.stylistic
    if (typeChecked === true) configs.typescriptTypedRecommended = typescriptConfigs.recommendedTypeChecked
    if (typeChecked === 'strict') configs.typescriptTypedStrict = typescriptConfigs.strictTypeChecked
  }
  if (removeUnusedImports) plugins['unused-imports'] = (await import('eslint-plugin-unused-imports')).default

  const reactPlugins = react
    ? {
        react: plugins.react,
        'react-hooks': plugins['react-hooks'],
        ...(hasNextJs
          ? {
              '@next/next': plugins['@next/next'],
            }
          : {}),
      }
    : {}

  return (
    [
      configs.gitignore(),
      eslint.configs.recommended,
      {
        name: '@repo/base',
        files,
        plugins: BASE_PLUGINS,
        rules: {
          'comma-dangle': ['error', 'always-multiline'],
          eqeqeq: ['error', 'always'],
          'func-style': ['error', 'expression'],
          'max-lines':
            maxLines === -1
              ? 'off'
              : [
                  'error',
                  {
                    max: maxLines,
                    skipBlankLines: true,
                    skipComments: true,
                  },
                ],
          'no-console': ['warn', { allow: ['error', 'warn'] }],
          'no-duplicate-imports': ['error', { includeExports: true }],
          ...noRestrictedImports({
            allowRelativeImports,
            namedImports,
            restrictedImports: globalRestrictedImports,
            typescript: false,
          }),
          'no-template-curly-in-string': 'error',
          'no-useless-concat': 'error',
          'no-unused-vars': [
            'error',
            {
              argsIgnorePattern: '^_',
            },
          ],
          'no-var': 'error',
          'object-shorthand': ['error', 'always'],
          'padding-line-between-statements': emptyLineAfterReturn
            ? [
                'error',
                { blankLine: 'always', next: '*', prev: 'break' },
                { blankLine: 'always', next: '*', prev: 'continue' },
                { blankLine: 'always', next: '*', prev: 'return' },
              ]
            : 'off',
          'prefer-arrow-callback': [
            'error',
            {
              allowNamedFunctions: true,
            },
          ],
          'prefer-const': [
            'error',
            {
              destructuring: 'any',
              ignoreReadBeforeAssign: false,
            },
          ],
          'prefer-template': 'error',
          'sort-vars': [
            'error',
            {
              ignoreCase: false,
            },
          ],
          '@stylistic/array-bracket-newline': ['error', 'consistent'],
          '@stylistic/array-bracket-spacing': ['error', 'never'],
          '@stylistic/array-element-newline': ['error', 'consistent'],
          '@stylistic/eol-last': 'error',
          '@stylistic/max-len': 'off',
          '@stylistic/no-extra-semi': 'off',
          '@stylistic/no-multi-spaces': 'error',
          '@stylistic/no-multiple-empty-lines': [
            'error',
            {
              max: 1,
            },
          ],
          '@stylistic/no-trailing-spaces': 'error',
          '@stylistic/object-curly-spacing': ['error', 'always'],
          '@stylistic/quotes': [
            'error',
            'single',
            {
              avoidEscape: true,
            },
          ],
          '@stylistic/template-curly-spacing': ['error', 'never'],
          'import/exports-last': exportLast ? 'error' : 'off',
          'import/first': 'error',
          ...(nodePrefix !== 'ignore'
            ? {
                'import/enforce-node-protocol-usage': ['error', nodePrefix],
              }
            : {}),
          ...(!newlineAfterImport
            ? {
                'import/newline-after-import': [
                  'error',
                  {
                    considerComments: true,
                    exactCount: true,
                  },
                ],
              }
            : {}),
          'import/no-absolute-path': 'off',
          'import/no-amd': 'error',
          'import/no-commonjs': 'error',
          'import/no-deprecated': 'error',
          'import/no-duplicates': [
            'error',
            {
              'prefer-inline': true,
            },
          ],
          'import/no-empty-named-blocks': 'error',
          'import/no-mutable-exports': 'error',
          'import/no-self-import': 'error',
          'import/no-useless-path-segments': [
            'error',
            {
              noUselessIndex: true,
            },
          ],
          'perfectionist/sort-imports': [
            'error',
            sortImportsOptions({
              customExternalImports,
              customInternalImports,
              customSideEffectImports,
              importGroups,
              internalImports,
              newlinesBetweenGroups,
              tsconfig,
            }),
          ],
          'perfectionist/sort-named-imports': [
            'error',
            {
              groupKind: 'values-first',
              ignoreCase: false,
              type: 'alphabetical',
            },
          ],
        },
      },
      preferArrow && {
        name: '@repo/prefer-arrow',
        files,
        plugins: {
          'prefer-arrow-functions': plugins['prefer-arrow-functions'],
        },
        rules: {
          'prefer-arrow-functions/prefer-arrow-functions': [
            'error',
            {
              allowObjectProperties: true,
            },
          ],
        },
      },
      removeUnusedImports && {
        name: '@repo/unused-imports',
        files,
        plugins: {
          'unused-imports': plugins['unused-imports'],
        },
        rules: {
          'unused-imports/no-unused-imports': 'error',
        },
      },
      sortArrays && {
        files: Array.isArray(sortArrays) ? sortArrays : files,
        plugins: {
          'sort-array-values': plugins['sort-array-values'],
        },
        rules: {
          'sort-array-values/sort-array-values': 'error',
        },
      },
      sortDestructuredKeys && {
        files: Array.isArray(sortDestructuredKeys) ? sortDestructuredKeys : files,
        plugins: {
          'sort-destructure-keys': plugins['sort-destructure-keys'],
        },
        rules: {
          'sort-destructure-keys/sort-destructure-keys': 'error',
        },
      },
      sortExports && {
        files: Array.isArray(sortExports) ? sortExports : files,
        rules: {
          'perfectionist/sort-exports': 'error',
        },
      },
      sortObjectKeys && {
        files: Array.isArray(sortObjectKeys) ? sortObjectKeys : files,
        rules: {
          'perfectionist/sort-objects': 'error',
        },
      },
      ...(ignoreTs
        ? []
        : defineConfig(
            {
              ignores: ['**/*.?(c|m)js'],
            },
            configs.typescriptStylistic!,
            ...(typeChecked
              ? typeChecked === 'strict'
                ? configs.typescriptTypedStrict!
                : configs.typescriptTypedRecommended!
              : []),
            {
              name: '@repo/ts',
              languageOptions: {
                parserOptions: {
                  ecmaFeatures: {
                    jsx: !!react,
                    project: [tsconfig],
                  },
                  ecmaVersion: 'latest',
                  projectService: true,
                  tsconfigRootDir: tsconfigDir,
                },
              },
              settings: {
                'import/resolver': {
                  typescript: true,
                },
              },
              plugins: {
                '@stylistic': plugins['@stylistic'],
                // @ts-expect-error - Compatibility with @typescript-eslint
                import: plugins.import,
                perfectionist: plugins.perfectionist,
                ...reactPlugins,
              },
              rules: {
                'no-restricted-imports': 'off',
                'no-unused-vars': 'off',
                '@stylistic/member-delimiter-style': [
                  'error',
                  {
                    multiline: {
                      delimiter: 'none',
                      requireLast: false,
                    },
                  },
                ],
                '@stylistic/ts/indent': 'off',
                '@typescript-eslint/array-type': 'error',
                '@typescript-eslint/await-thenable': tsSeverity,
                '@typescript-eslint/consistent-type-imports': [
                  'error',
                  {
                    disallowTypeAnnotations: false,
                    fixStyle: 'inline-type-imports',
                    prefer: 'type-imports',
                  },
                ],
                '@typescript-eslint/no-empty-object-type': [
                  'error',
                  {
                    allowInterfaces: 'always',
                  },
                ],
                '@typescript-eslint/no-misused-promises': [
                  tsSeverity,
                  {
                    checksVoidReturn: {
                      attributes: false,
                    },
                  },
                ],
                ...noRestrictedImports({
                  allowRelativeImports,
                  namedImports,
                  restrictedImports: globalRestrictedImports,
                }),
                '@typescript-eslint/no-unnecessary-template-expression': 'error',
                '@typescript-eslint/no-unsafe-assignment': tsSeverity,
                '@typescript-eslint/no-unused-vars': [
                  'error',
                  {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                    varsIgnorePattern: '^_',
                  },
                ],
                '@typescript-eslint/prefer-for-of': 'error',
                '@typescript-eslint/prefer-string-starts-ends-with': 'error',
                '@typescript-eslint/restrict-template-expressions': [
                  'error',
                  {
                    allowNumber: true,
                  },
                ],
                '@typescript-eslint/unbound-method': 'off',
                'import/default': 'off',
                'import/named': 'off',
                'import/namespace': 'off',
                'import/no-cycle': tsSeverity,
                'import/no-deprecated': tsSeverity,
                'import/no-named-as-default-member': 'off',
                'import/no-named-as-default': tsSeverity,
                'import/no-unresolved': 'off',
                'import/no-unused-modules': tsSeverity,
                'perfectionist/sort-interfaces': sortInterfaces === true ? 'error' : 'off',
              },
            },
            Array.isArray(sortInterfaces)
              ? {
                  files: sortInterfaces,
                  name: '@repo/ts/interfaces',
                  rules: {
                    'perfectionist/sort-interfaces': 'error',
                  },
                }
              : {},
            {
              files: ['**/*.d.ts', '**/types.ts'],
              name: '@repo/dts',
              rules: {
                'max-lines': 'off',
              },
            },
          )),
      ...(scopedRestrictedImports.length > 0
        ? scopedRestrictedImports.map(({ ignores, restrictedImports: scopedPatterns }) => ({
            files: ignores,
            rules: {
              ...noRestrictedImports({
                allowRelativeImports,
                namedImports,
                restrictedImports: scopedPatterns,
                typescript: !ignoreTs,
              }),
            },
          }))
        : []),
      react && {
        name: '@repo/react',
        files: jsxFiles,
        plugins: reactPlugins,
        rules: {
          ...plugins.react!.configs['jsx-runtime'].rules,
          ...plugins['react-hooks']!.configs.recommended.rules,
          ...(hasNextJs && plugins['@next/next']
            ? {
                ...plugins['@next/next'].configs.recommended.rules,
                ...plugins['@next/next'].configs['core-web-vitals'].rules,
              }
            : {}),
          '@stylistic/jsx-curly-brace-presence': [
            'error',
            {
              children: 'always',
              propElementValues: 'always',
              props: 'never',
            },
          ],
          'perfectionist/sort-jsx-props': sortProps === true ? 'error' : 'off',
          'react/jsx-key': 'error',
          'react/jsx-uses-react': 'off',
          'react/react-in-jsx-scope': 'off',
          'react-hooks/exhaustive-deps': [
            'warn',
            {
              enableDangerousAutofixThisMayCauseInfiniteLoops: true,
            },
          ],
        },
      },
      {
        name: '@repo/configs',
        files: configFiles,
        rules: {
          'no-restricted-imports': 'off',
          'no-template-curly-in-string': 'off',
          'import/newline-after-import': 'off',
          'import/no-anonymous-default-export': 'off',
          'sort-array-values/sort-array-values': 'off',
          '@typescript-eslint/no-unsafe-return': 'off',
        },
      },
      ...(prettier
        ? [
            {
              files: prettierFiles,
              name: '@repo/prettier',
              plugins: {
                prettier: plugins.prettier,
              },
              rules: {
                'prettier/prettier': [
                  'error',
                  ...(typeof prettier === 'object' ? [prettier] : [{}, { usePrettierrc: true }]),
                ],
              },
            },
            configs.prettier,
            configs.prettierRecommended,
          ]
        : []),
      turbo && {
        name: '@repo/turbo',
        files,
        plugins: {
          turbo: plugins.turbo,
        },
        rules: {
          'turbo/no-undeclared-env-vars': [
            'error',
            {
              allowList: typeof turbo === 'object' ? turbo.allowList : [],
            },
          ],
        },
      },
      tailwind && {
        name: '@repo/tailwind',
        files,
        languageOptions: react
          ? {
              parserOptions: {
                ecmaFeatures: {
                  jsx: true,
                },
              },
            }
          : {},
        plugins: {
          'better-tailwindcss': plugins['better-tailwindcss'],
        },
        settings: {
          'better-tailwindcss': tailwindConfig,
        },
        rules: {
          'better-tailwindcss/enforce-consistent-class-order': 'error',
          'better-tailwindcss/enforce-consistent-important-position': 'error',
          'better-tailwindcss/enforce-consistent-line-wrapping': [
            'error',
            {
              group: 'newLine',
              preferSingleLine: true,
              printWidth,
            },
          ],
          'better-tailwindcss/enforce-consistent-variable-syntax': 'error',
          'better-tailwindcss/enforce-shorthand-classes': 'error',
          'better-tailwindcss/no-conflicting-classes': 'error',
          'better-tailwindcss/no-duplicate-classes': 'error',
          'better-tailwindcss/no-deprecated-classes': 'error',
          'better-tailwindcss/no-restricted-classes': 'error',
          'better-tailwindcss/no-unnecessary-whitespace': 'error',
          'better-tailwindcss/no-unregistered-classes': [
            'error',
            {
              ignore: allowedTailwindClasses,
            },
          ],
          'better-tailwindcss/sort-classes': 'error',
        },
      },
      {
        files,
        rules: {
          'arrow-body-style': ['error', 'as-needed'],
        },
      },
      rules && {
        name: '@repo/rules',
        rules,
      },
      ...userConfig,
    ] as Linter.Config<Linter.RulesRecord>[]
  )
    .filter(config => typeof config === 'object' && Object.keys(config).length > 0)
    .map(config => {
      const configIgnores = [...(ignores ?? []), ...(config.ignores ?? [])]
      if (configIgnores.length) return { ...config, ignores: configIgnores }
      return config
    })
}

export default eslintConfig
export type { Options }
export * from './types'
export * from './utils'
