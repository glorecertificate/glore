import { serialize } from '@repo/utils/serialize'
import { type AnyRecord } from '@repo/utils/types'

import { type api as Api } from '@/lib/api'
import { type DatabaseClient, type SelectData } from '@/lib/api/types'
import { type TableName } from '@/lib/db/types'

/**
 * Formatted timestamps for GraphQL queries.
 */
export const timestamps = `
  createdAt:created_at,
  updatedAt:updated_at
`

/**
 * Creates an API client for client or server-side usage.
 */
export const createClient = (client: typeof Api, db: DatabaseClient) =>
  Object.fromEntries(
    Object.entries(client).map(([moduleName, module]) => [
      moduleName,
      Object.fromEntries(
        Object.entries(module).map(([requestName, request]) => [
          requestName,
          (...args: unknown[]) => (request as (...args: unknown[]) => unknown)(db, ...args),
        ]),
      ),
    ]),
  ) as {
    [K in keyof typeof Api]: {
      [R in keyof (typeof Api)[K]]: (typeof Api)[K][R] extends (db: DatabaseClient, ...args: infer P) => infer Ret
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
