import { deepmerge } from 'deepmerge-ts'

import { RELEASE_OPTIONS } from './config'
import { type Options } from './types'

export const releaseConfig = (options?: Options): Options => {
  if (!options) return RELEASE_OPTIONS
  return deepmerge(RELEASE_OPTIONS, options)
}

export type * from './types'
