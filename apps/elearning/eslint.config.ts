import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  customExternalImports: ['react', 'next', '@next'],
  customInternalImports: ['@repo'],
  internalImports: ['config', 'supabase'],
  maxLines: -1,
  namedImports: ['react'],
  react: 'nextjs',
  restrictedImports: [
    {
      files: ['src/app/**/*.ts?(x)', 'src/components/features/**/*.ts?(x)'],
      group: ['@radix-ui'],
      message: 'Import or create an internal component instead.',
    },
    {
      files: ['src/app/**/*.ts?(x)'],
      group: ['next-intl'],
      message: 'Import from internal modules instead.',
    },
    {
      files: ['src/app/**/*.ts?(x)'],
      group: ['next/navigation'],
      importNames: ['usePathname'],
      message: 'Import the internal hook instead.',
    },
  ],
  sortArrays: ['src/**/*.ts?(x)'],
  sortInterfaces: false,
  sortObjectKeys: ['*.ts'],
  tailwind: {
    allowedClasses: ['lucide', 'lucide-*', 'markdown'],
    entryPoint: 'src/app/globals.css',
  },
})
