import eslintConfig, { RuleSeverity } from '@repo/eslint-config'

export default eslintConfig({
  allowRelativeImports: 'siblings',
  customExternalImports: ['release-it'],
  rules: {
    'no-template-curly-in-string': RuleSeverity.Off,
  },
  sortObjectKeys: false,
})
