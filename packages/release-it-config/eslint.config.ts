import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  sortObjectKeys: false,
  sortInterfaces: false,
  overrides: [
    {
      rules: {
        'no-template-curly-in-string': 0,
      },
    },
  ],
})
