import { type DatabaseClient } from '@/lib/db'

import { API_MODULES } from './config'
import { type Api } from './types'

/**
 * Creates an API client for client or server-side usage.
 */
export const createApiClient = (db: DatabaseClient, modules = API_MODULES) =>
  Object.fromEntries(
    Object.entries(modules).map(([moduleName, module]) => [
      moduleName,
      Object.fromEntries(
        Object.entries(module).map(([requestName, request]) => [
          requestName,
          (...args: unknown[]) => (request as (...args: unknown[]) => unknown)(db, ...args),
        ]),
      ),
    ]),
  ) as Api
