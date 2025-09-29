import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  cjsInterop: true,
  dts: true,
  entry: ['src/index.ts', 'src/configs/*.ts'],
  format: ['cjs', 'esm'],
  minify: true,
  outDir: 'build',
  splitting: false,
  esbuildOptions: options => {
    options.footer = {
      js: 'module.exports = module.exports.default;',
    }
  },
})
