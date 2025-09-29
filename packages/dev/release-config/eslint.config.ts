import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  customExternalImports: ['release-it'],
  rules: {
    'no-template-curly-in-string': 'off',
  },
  sortObjectKeys: false,
})
