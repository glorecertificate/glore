import { deepmerge } from 'deepmerge-ts'

import { DEFAULT_CONFIG } from './config'
import { type Config } from './types'

export const defineConfig = (config?: Config): Config => {
  if (!config) return DEFAULT_CONFIG
  return deepmerge(DEFAULT_CONFIG, config)
}

export * from './types'
