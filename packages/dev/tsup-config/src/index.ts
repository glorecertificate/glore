import { TSUP_OPTIONS } from './config'
import { type Options } from './types'
import { mergeWithDefaults } from './utils'

const tsupConfig = (options?: Options) => {
  if (!options) return TSUP_OPTIONS
  return mergeWithDefaults(options)
}

export default tsupConfig
export type * from './types'
