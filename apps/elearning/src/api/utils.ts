import { serialize, type AnyRecord } from '@repo/utils'

import { type API } from '@/api/client'
import { type DatabaseClient, type SelectData } from '@/api/types'
import { type TableName } from '@/lib/db/types'

/**
 * Creates an API client for client or server-side usage.
 */
export const createApi = (api: typeof API, db: DatabaseClient) =>
  Object.fromEntries(
    Object.entries(api).map(([moduleName, module]) => [
      moduleName,
      Object.fromEntries(
        Object.entries(module).map(([requestName, request]) => [
          requestName,
          (...args: unknown[]) => (request as (...args: unknown[]) => unknown)(db, ...args),
        ]),
      ),
    ]),
  ) as {
    [K in keyof typeof api]: {
      [R in keyof (typeof api)[K]]: (typeof api)[K][R] extends (db: DatabaseClient, ...args: infer P) => infer Ret
        ? (...args: P) => Ret
        : never
    }
  }

/**
 * Creates a parser function from a database record.
 */
export const createParser =
  <T extends TableName, Q extends string, O extends AnyRecord>(parser: (r: SelectData<T, Q>) => O) =>
  (record: SelectData<T, Q>) =>
    serialize(parser(record))

/**
 * Formatted timestamps for GraphQL queries.
 */
export const timestamps = `
  createdAt:created_at,
  updatedAt:updated_at
`
