import { type DatabaseClient } from '@/lib/db'

import { default as auth } from './modules/auth'
import { default as certificates } from './modules/certificates'
import { default as courses } from './modules/courses'
import { default as organizations } from './modules/organizations'
import { default as users } from './modules/users'

export type * from './modules/auth'
export type * from './modules/certificates'
export type * from './modules/courses'
export type * from './modules/organizations'
export type * from './modules/users'

const API_MODULES = {
  auth,
  certificates,
  courses,
  organizations,
  users,
} as const

/**
 * API client type.
 */
export type ApiClient = {
  [M in keyof typeof API_MODULES]: {
    [R in keyof (typeof API_MODULES)[M]]: (typeof API_MODULES)[M][R] extends (
      db: DatabaseClient,
      ...args: infer P
    ) => infer U
      ? (...args: P) => U
      : never
  }
}

/**
 * Creates an API client for client or server-side usage.
 */
export const createClient = (db: DatabaseClient) =>
  Object.fromEntries(
    Object.entries(API_MODULES).map(([moduleName, module]) => [
      moduleName,
      Object.fromEntries(
        Object.entries(module).map(([requestName, request]) => [
          requestName,
          (...args: unknown[]) => (request as (...args: unknown[]) => unknown)(db, ...args),
        ])
      ),
    ])
  ) as ApiClient

/**
 * Creates a server-side API client.
 */
export const createApiClient = async () => {
  const { createDatabaseClient } = await import('@/lib/db')

  const db = await createDatabaseClient()
  return createClient(db)
}
