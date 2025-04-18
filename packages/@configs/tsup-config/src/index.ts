import { type defineConfig, type Options } from 'tsup'

const tsupConfigBase: Options = {
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  minify: true,
  outDir: 'build',
}

type Config = ReturnType<typeof defineConfig>

const tsupConfig = (options?: Options) =>
  ({
    ...tsupConfigBase,
    ...(options ?? {}),
  }) as Config

export default tsupConfig
export type { Config, Options }
