import eslintConfig, { RuleSeverity } from '@repo/eslint-config'

export default eslintConfig({
  allowRelativeImports: 'always',
  ignores: ['apps', 'packages'],
  sortObjectKeys: false,
  rules: {
    'no-template-curly-in-string': RuleSeverity.Off,
  },
})
