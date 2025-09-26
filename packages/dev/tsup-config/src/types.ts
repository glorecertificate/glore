import { type defineConfig, type Options as TsupOptions } from 'tsup'

export type Config = ReturnType<typeof defineConfig>
export interface Options extends TsupOptions {}
