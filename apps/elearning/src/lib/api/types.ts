import { type DatabaseClient } from '@/lib/db'

import { type API_MODULES } from './config'

/**
 * API client type.
 */
export type Api = {
  [M in keyof typeof API_MODULES]: {
    [R in keyof (typeof API_MODULES)[M]]: (typeof API_MODULES)[M][R] extends (
      db: DatabaseClient,
      ...args: infer P
    ) => infer U
      ? (...args: P) => U
      : never
  }
}

export type * from './auth/types'
export type * from './certificates/types'
export type * from './courses/types'
export type * from './organizations/types'
export type * from './users/types'
