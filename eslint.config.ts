import eslintConfig from '@repo/eslint-config'

export default eslintConfig({
  ignores: ['apps', 'packages'],
  sortObjectKeys: false,
  overrides: [
    {
      rules: {
        'no-template-curly-in-string': 0,
      },
    },
  ],
})
