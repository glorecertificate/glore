import { stdout } from 'node:process'

export interface LoggerOptions {
  /** @default true */
  newline?: boolean
  /** @default false */
  replace?: boolean
}

const clearLine = () => {
  if (!stdout.isTTY) return
  stdout.clearLine(0)
  stdout.cursorTo(0)
}
const red = (text: string) => `\u001b[31m${text}\u001b[0m`
const green = (text: string) => `\u001b[32m${text}\u001b[0m`
const yellow = (text: string) => `\u001b[33m${text}\u001b[0m`

/**
 * Simple logging utility with support for colored output and line replacement.
 */
export const logger = (message: string, { newline = true, replace }: LoggerOptions = {}) => {
  if (replace) clearLine()
  const suffix = newline ? '\n' : ''
  stdout.write(`${message}${suffix}`)
}

logger.inline = (message: string) => {
  if (!stdout.isTTY) return
  logger(message, { newline: false })
}
logger.red = (message: string, options: LoggerOptions = {}) => logger(red(message), options)
logger.green = (message: string, options: LoggerOptions = {}) => logger(green(message), options)
logger.yellow = (message: string, options: LoggerOptions = {}) => logger(yellow(message), options)
logger.success = (message: string, options: LoggerOptions = {}) => logger(green('✓ ') + message, options)
logger.error = (message: string, options: LoggerOptions = {}) => {
  if (options.replace) clearLine()
  logger(red('✗ ') + message, options)
}
logger.warn = (message: string, options: LoggerOptions = {}) => logger(yellow('⚠ ') + message, options)
