import eslintConfig from './src'

export default eslintConfig({
  customExternalImports: ['@eslint', 'eslint'],
  customInternalImports: ['deepmerge-ts'],
  maxLines: -1,
  newlineAfterImport: true,
  sortObjectKeys: false,
  turbo: {
    allowList: ['CI'],
  },
  typeCheck: false,
})
