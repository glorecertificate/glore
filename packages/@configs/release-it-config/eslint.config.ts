import eslintConfig, { RuleSeverity } from '@repo/eslint-config'

export default eslintConfig({
  rules: {
    'no-template-curly-in-string': RuleSeverity.Off,
  },
  sortInterfaces: false,
  sortObjectKeys: false,
})
