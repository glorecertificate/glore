import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  exportsLast: false,
  importGroups: [
    ['side-effect', 'side-effect-style'],
    ['builtin'],
    ['react', 'next', '@next'],
    ['external'],
    ['internal'],
    ['parent', 'index', 'sibling'],
  ],
  internalImports: ['supabase', 'static'],
  maxLines: -1,
  namedImports: ['react'],
  react: 'nextjs',
  sortArrayValues: ['src/**/*.ts?(x)'],
  sortObjectKeys: ['*.ts'],
  tailwindCss: true,
  tsconfigRootDir: import.meta.dirname,
  useNodePrefix: 'ignore',
})
