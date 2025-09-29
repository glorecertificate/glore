import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  allowRelativeImports: 'always',
  maxLines: 500,
  typeCheck: false,
})
