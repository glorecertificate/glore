import eslintConfig, { noRestrictedImports } from '@repo/eslint-config'

export default eslintConfig(
  {
    react: 'nextjs',
    maxLines: -1,
    optimizeTypedRules: true,
    customExternalImports: ['@next', 'next', 'react'],
    customInternalImports: ['@config', '@repo'],
    customSideEffectImports: ['@repo/env/config'],
    namedImports: ['react'],
    restrictedImports: [
      {
        allowTypeImports: true,
        group: ['next/link', '@repo/ui/components/link'],
        ignoreFiles: ['src/components/ui/link.tsx'],
        message: 'Import from @/components/ui/link instead.',
      },
      {
        regex: '^@\\/lib\\/[^/]+\\/(?!ssr$).+',
        ignoreFiles: ['src/lib/*/*/**'],
        message:
          'Avoid deep imports from the lib folder. Import from the root or /ssr for server-side imports instead.',
      },
      {
        group: ['@repo/i18n'],
        ignoreFiles: ['src/lib/i18n.ts'],
        importNames: ['getTranslations'],
        message: 'Import from @/lib/i18n instead.',
      },
      {
        group: ['@supabase/supabase-js'],
        ignoreFiles: ['src/lib/api/auth/types.ts'],
        importNames: ['AuthUser', 'User', 'UserAttributes', 'UserResponse'],
        message: 'Import the prefixed Auth* type from @/lib/api instead.',
      },
      {
        group: ['next/navigation'],
        ignoreFiles: [
          'src/app/global-error.tsx',
          'src/components/providers/navigation-provider.tsx',
          'src/hooks/use-navigation.ts',
          'src/lib/navigation/**',
        ],
        allowImportNames: ['notFound'],
        message: 'Use the useNavigation hook or import from @/lib/navigation instead.',
      },
    ],
    sortArrays: ['src'],
    sortExports: false,
    sortInterfaces: false,
    sortObjectKeys: false,
    tailwind: {
      allowedClasses: [
        'font-heading',
        'ignore-click-outside/*',
        'lucide',
        'lucide-*',
        'markdown',
        'slate-*',
        'toaster',
      ],
    },
    turbo: {
      allowList: ['ANALYZE', 'COOKIE_PREFIX'],
    },
  },
  {
    files: ['supabase/functions/**'],
    rules: {
      ...noRestrictedImports({
        allowRelativeImports: 'always',
        restrictedImports: [
          {
            allowTypeImports: false,
            group: ['@/**'],
            message: 'Only relative imports are allowed in Supabase functions.',
          },
        ],
      }),
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'always',
        },
      ],
      'react/react-in-jsx-scope': 'error',
    },
  },
)
