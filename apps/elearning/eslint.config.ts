import eslintConfig from '@repo/eslint-config'

export default eslintConfig(
  {
    customExternalImports: ['react', 'next', '@next'],
    customInternalImports: ['@repo'],
    internalImports: ['config', 'supabase'],
    maxLines: -1,
    namedImports: ['react'],
    react: 'nextjs',
    restrictedImports: [
      {
        files: ['**/*.ts?(x)', '!src/components/ui/**'],
        group: ['@radix-ui'],
        message: 'Import or create an internal component instead.',
      },
      {
        files: [
          '**/*.ts?(x)',
          '!src/app/global-error.tsx',
          '!src/components/providers/**',
          '!src/hooks/**',
          '!src/lib/**',
        ],
        group: ['next/navigation', 'next-intl', 'next-intl/*'],
        importNames: ['usePathname', 'useTranslations'],
        message: 'Import from internal modules instead.',
      },
    ],
    sortArrays: ['src/**/*.ts?(x)'],
    sortInterfaces: false,
    sortObjectKeys: ['*.ts'],
    tailwind: {
      allowedClasses: ['lucide', 'lucide-*', 'markdown', 'rich-text-editor', 'toaster'],
      entryPoint: './src/app/globals.css',
    },
  },
  {
    files: ['supabase/seed.ts'],
    rules: {
      'turbo/no-undeclared-env-vars': 0,
    },
  },
)
