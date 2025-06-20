import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  customExternalImports: ['react', 'next', '@next'],
  customInternalImports: ['@repo'],
  internalImports: ['static', 'supabase'],
  maxLines: -1,
  namedImports: ['react'],
  react: 'nextjs',
  sortArrays: ['src/**/*.ts?(x)'],
  sortInterfaces: false,
  sortObjectKeys: ['*.ts'],
  tailwind: {
    allowedClasses: ['lucide', 'lucide-*', 'markdown'],
    entryPoint: 'src/app/globals.css',
  },
})
