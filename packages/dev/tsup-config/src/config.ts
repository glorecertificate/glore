import { type Options } from './types'

export const TSUP_OPTIONS = {
  clean: true,
  dts: {
    compilerOptions: {
      removeComments: false,
    },
  },
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  minify: true,
  outDir: 'build',
  splitting: false,
} satisfies Options
