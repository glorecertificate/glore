import 'server-only'

import { Pool as NeonPool, neon } from '@neondatabase/serverless'
import { type NeonHttpDatabase, drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { type NeonDatabase, drizzle as drizzleNeonServerless } from 'drizzle-orm/neon-serverless'
import { type NodePgDatabase, drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '@/db/schema'

const DATABASE_URL = process.env.DATABASE_URL

const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/u.test(DATABASE_URL)

const drizzleOptions = { schema, casing: 'snake_case' } as const

export const db = (
  isLocal
    ? drizzlePg({ client: new Pool({ connectionString: DATABASE_URL, max: 5 }), ...drizzleOptions })
    : drizzleNeon({ client: neon(DATABASE_URL), ...drizzleOptions })
) as NeonHttpDatabase<typeof schema>

type PgDatabaseClient = NodePgDatabase<typeof schema>

export type Transaction = Parameters<Parameters<PgDatabaseClient['transaction']>[0]>[0]

let serverlessDb: NeonDatabase<typeof schema> | undefined

const getServerlessDb = () => {
  serverlessDb ??= drizzleNeonServerless({
    client: new NeonPool({ connectionString: DATABASE_URL, max: 3 }),
    ...drizzleOptions,
  })
  return serverlessDb
}

export const transaction = async <T>(fn: (tx: Transaction) => Promise<T>): Promise<T> => {
  if (isLocal) return await (db as unknown as PgDatabaseClient).transaction(fn)

  const txDb = getServerlessDb()
  return (await txDb.transaction(fn as Parameters<typeof txDb.transaction>[0])) as T
}
