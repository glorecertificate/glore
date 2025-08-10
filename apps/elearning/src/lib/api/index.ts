import { default as auth } from './auth'
import { default as certificates } from './certificates'
import { default as courses } from './courses'
import { default as organizations } from './organizations'
import { default as users } from './users'

export * from './types'

/**
 * Internal API client.
 */
export const api = {
  auth,
  certificates,
  courses,
  organizations,
  users,
}
