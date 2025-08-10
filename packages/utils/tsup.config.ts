import tsupConfig from '@repo/tsup-config'

export default tsupConfig({
  entry: ['src/*.ts'],
  splitting: false,
})
