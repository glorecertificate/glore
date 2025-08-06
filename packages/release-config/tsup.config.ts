import tsupConfig from '@repo/tsup-config'

export default tsupConfig({
  dts: {
    entry: ['src/index.ts'],
    compilerOptions: {
      removeComments: false,
    },
  },
})
