import { NextResponse, type NextRequest } from 'next/server'

import { serialize, type AnyRecord } from '@repo/utils'

import { type API_MODULES } from '@/lib/api/config'
import { type DatabaseClient, type SelectData } from '@/lib/api/types'
import { type TableName } from '@/lib/db/types'
import { AuthPage, type Route } from '@/lib/navigation'
import { deleteCookie } from '@/lib/storage/server'
import { type Cookie } from '@/lib/storage/types'

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
export const createClient = (api: typeof API_MODULES, db: DatabaseClient) =>
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
 * Resets the user session by deleting the user cookie and redirecting to the provided page.
 */
export const createReset =
  (request: NextRequest, response: NextResponse, cookie: Cookie, redirect: Route | `${Route}` = '/login') =>
  async () => {
    if (isAuthRequest(request)) return response
    await deleteCookie(cookie)
    return NextResponse.redirect(new URL(redirect, request.url))
  }

/**
 * Checks if the request is for an authenticated page.
 */
export const isAuthRequest = (request: NextRequest) =>
  Object.values(AuthPage).includes(request.nextUrl.pathname as AuthPage)
