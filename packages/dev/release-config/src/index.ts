import { deepMerge } from '@repo/utils/deep-merge'

import { RELEASE_OPTIONS } from './config'
import { type Options } from './types'

export const releaseConfig = (options?: Options): Options => {
  if (!options) return RELEASE_OPTIONS
  return deepMerge(RELEASE_OPTIONS, options)
}

export type * from './types'
