import eslintConfig from '@repo/eslint-config'

export default eslintConfig(
  {
    maxLines: 500,
    typeCheck: false,
  },
  {
    files: ['src/hex-to-rgb.ts'],
    rules: {
      'perfectionist/sort-objects': 'off',
    },
  },
)
