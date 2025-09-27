import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  customExternalImports: ['react', 'use-intl'],
  customInternalImports: ['@config'],
  sortExports: false,
  sortInterfaces: false,
  sortObjectKeys: false,
})
