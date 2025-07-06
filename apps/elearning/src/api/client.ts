import { createApi } from '@/api/utils'
import { db } from '@/lib/db/client'
import { getDatabase } from '@/lib/db/server'

import * as auth from './modules/auth/requests'
import * as certificates from './modules/certificates/requests'
import * as courses from './modules/courses/requests'
import * as organizations from './modules/organizations/requests'
import * as users from './modules/users/requests'

/**
 * API modules.
 */
export const API = {
  auth,
  certificates,
  courses,
  organizations,
  users,
}

/**
 * API client for browser usage.
 */
export const api = createApi(API, db)

/**
 * Creates a server-side API client.
 */
export const getApi = async () => {
  const db = await getDatabase()
  return createApi(API, db)
}
