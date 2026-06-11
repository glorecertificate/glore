import { parseAsBoolean, parseAsString } from 'nuqs/server'

export const authParsers = {
  error: parseAsString,
  expired: parseAsBoolean.withDefault(false),
  loggedOut: parseAsBoolean.withDefault(false),
  token: parseAsString,
}
