import tsupConfig from '@repo/tsup-config'

export default tsupConfig({
  entry: ['src/*'],
  splitting: true,
})
