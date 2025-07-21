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
    internalImports: ['#rte', 'config', 'supabase'],
    maxLines: -1,
    namedImports: ['react'],
    react: 'nextjs',
    restrictedImports: [
      {
        files: ['**/*.ts?(x)', '!src/components/ui/**'],
        group: ['@radix-ui'],
        message: 'Import or create a new component instead.',
      },
      {
        files: [
          '**/*.ts?(x)',
          '!src/app/global-error.tsx',
          '!src/components/providers/**',
          '!src/hooks/**',
          '!src/lib/**',
        ],
        group: ['next/navigation', 'use-intl'],
        importNames: ['usePathname', 'useLocale', 'useTranslations'],
        message: 'Import the internal hook instead.',
      },
      {
        files: ['**/*.ts?(x)', '!src/components/ui/link.tsx'],
        group: ['next/link'],
        importNames: ['default'],
        message: 'Import the internal component instead.',
      },
      {
        files: ['src/components/ui/rich-text-editor/**'],
        group: ['@/components/ui/rich-text-editor/**'],
        message: 'Import using the alias #rte instead.',
      },
    ],
    sortArrays: ['src/**/*.ts?(x)'],
    sortInterfaces: false,
    sortObjectKeys: ['*.ts'],
    tailwind: {
      allowedClasses: [
        'dark',
        'font-heading',
        'ignore-click-outside/*',
        'lucide',
        'lucide-*',
        'markdown',
        'slate-*',
        'toaster',
      ],
      entryPoint: './src/app/globals.css',
    },
  },
  {
    files: ['src/components/ui/rich-text-editor/**'],
    rules: {
      '@next/next/no-img-element': 0,
    },
  },
  {
    files: ['supabase/seed.ts'],
    rules: {
      'turbo/no-undeclared-env-vars': 0,
    },
  },
)
