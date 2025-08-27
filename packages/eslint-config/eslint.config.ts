import eslintConfig from './build'

export default eslintConfig({
  customExternalImports: ['@eslint', 'eslint'],
  customInternalImports: ['@repo/prettier-config'],
  maxLines: -1,
  newlineAfterImport: true,
  sortObjectKeys: false,
  typeCheck: false,
})
