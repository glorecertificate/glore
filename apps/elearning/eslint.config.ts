import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  importGroups: [
    ['side-effect', 'side-effect-style'],
    'builtin',
    ['react', 'next', '@next'],
    ['external'],
    '@repo',
    'internal',
    ['parent', 'index', 'sibling'],
  ],
  internalImports: ['config', 'supabase'],
  maxLines: -1,
  namedImports: ['react'],
  react: 'next.js',
  sortArrayValues: ['src/**/*.ts?(x)'],
  sortObjectKeys: ['*.ts'],
  tailwindCss: true,
  useNodePrefix: 'ignore',
})
