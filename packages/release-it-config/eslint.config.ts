import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  overrides: [
    {
      rules: {
        'no-template-curly-in-string': 0,
      },
    },
  ],
})
