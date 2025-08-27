import eslintConfig from '@repo/eslint-config'

export default eslintConfig(
  {
    allowRelativeImports: [
      'siblings',
      {
        never: ['src/components/ui/rich-text-editor/**'],
      },
    ],
    customExternalImports: ['@next', 'next', 'react'],
    customInternalImports: ['@repo'],
    internalImports: ['config', 'supabase'],
    maxLines: -1,
    namedImports: ['react'],
    optimizeTypedRules: true,
    react: 'nextjs',
    restrictedImports: [
      {
        group: ['@radix-ui'],
        ignoreFiles: ['src/components/ui/**'],
        message: 'Import or create a new component instead.',
      },
      {
        group: ['next/navigation', 'use-intl'],
        ignoreFiles: [
          'src/app/global-error.tsx',
          'src/components/providers/**',
          'src/hooks/use-locale.ts',
          'src/hooks/use-pathname.ts',
          'src/hooks/use-translations.ts',
          'src/lib/i18n/**',
        ],
        importNames: ['getTranslations', 'useLocale', 'usePathname', 'useTranslations'],
        message: 'Import the internal hook or provider instead.',
      },
      {
        group: ['next/link'],
        ignoreFiles: ['src/components/ui/link.tsx'],
        importNames: ['default'],
        message: 'Import the internal component instead.',
      },
      {
        group: ['@rte/**'],
        ignoreFiles: ['src/components/ui/rich-text-editor/**'],
        message: 'Import from the components folder instead.',
      },
    ],
    sortArrays: ['src/**/*.ts?(x)'],
    sortInterfaces: false,
    sortObjectKeys: ['*.ts'],
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
  },
  {
    files: ['src/components/ui/rich-text-editor/**'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
)
