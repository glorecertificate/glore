import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  exportsLast: false,
  importGroups: [
    ['side-effect', 'side-effect-style'],
    ['builtin'],
    ['react', 'next', '@next'],
    ['external'],
    ['@repo'],
    ['internal'],
    ['parent', 'index', 'sibling'],
  ],
  internalImports: ['config', 'supabase'],
  maxLines: -1,
  namedImports: ['react'],
  react: 'nextjs',
  sortArrayValues: ['src/**/*.ts?(x)'],
  sortInterfaces: false,
  sortObjectKeys: ['*.ts'],
  tailwindCss: true,
  tsconfigRootDir: import.meta.dirname,
  useNodePrefix: 'ignore',
})
