/* eslint-disable no-console */
import { noop } from '@/noop'

/**
 * Logger type definition for the log utility.
 */
export type Logger = typeof log

/**
 * Simple logging utility supporting error and warn methods.
 */
export const log = Object.assign(
  (...data: any[]) => {
    console.log(...data)
  },
  {
    error: (...data: any[]) => console.error('\x1b[31m✖︎\x1b[0m', ...data),
    info: (...data: any[]) => console.log('\x1b[34mℹ︎\x1b[0m', ...data),
    success: (...data: any[]) => console.log('\x1b[32m✔︎\x1b[0m', ...data),
    warn: (...data: any[]) => console.warn('\x1b[33m⚠︎\x1b[0m', ...data),
  },
)
export const logger = log

/**
 * Creates a logging instance that conditionally logs based on the provided condition.
 * If the condition is true, it returns a noop logger, otherwise it returns a standard log instance.
 */
export const createLogger = (silent = false) =>
  silent
    ? Object.assign(noop, {
        error: noop,
        info: noop,
        success: noop,
        warn: noop,
      })
    : log
