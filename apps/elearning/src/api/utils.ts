import { serialize, type AnyRecord } from '@repo/utils'

import { createDatabaseClient } from '@/lib/db/server'
import { type TableName } from '@/lib/db/types'

/**
 * Creates a parser function from a database record.
 */
export const createParser =
  <T extends TableName, Q extends string, O extends AnyRecord>(parser: (r: SelectData<T, Q>) => O) =>
  (record: SelectData<T, Q>) =>
    serialize(parser(record))

const _select =
  <T extends TableName, Q extends string>(table: T, query: Q) =>
  async () =>
    await (await createDatabaseClient()).from(table).select(query).single()

type SelectData<T extends TableName, Q extends string> = NonNullable<
  Awaited<ReturnType<ReturnType<typeof _select<T, Q>>>>['data']
>
