import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/*.ts',
  format: ['cjs', 'esm'],
  nodeProtocol: true,
  minify: true,
  dts: true,
  sourcemap: true,
  outputOptions: {
    minifyInternalExports: true,
    preserveModules: true,
  },
  ignoreWatch: ['.turbo'],
})
