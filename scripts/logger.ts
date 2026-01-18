import { stdout } from 'node:process'

export interface LoggerOptions {
  /** @default false */
  clearLine?: boolean
  /** @default true */
  newline?: boolean
}

const red = (text: string) => `\u001b[31m${text}\u001b[0m`
const green = (text: string) => `\u001b[32m${text}\u001b[0m`
const yellow = (text: string) => `\u001b[33m${text}\u001b[0m`
const replaceLine = () => {
  if (!stdout.isTTY) return
  stdout.clearLine(0)
  stdout.cursorTo(0)
}

/**
 * Logging utility with support for colored output and line replacement.
 */
export const logger = (message = '', options: LoggerOptions = loggerOptions) => {
  const { clearLine = false, newline = true } = options
  if (clearLine) replaceLine()
  const suffix = newline ? '\n' : ''
  stdout.write(`${message}${suffix}`)
}

const loggerOptions = {
  clearLine: stdout.isTTY,
}

logger.options = loggerOptions

logger.inline = (message = '', options: LoggerOptions = {}) => {
  if (!stdout.isTTY) return
  logger(message, { ...options, newline: false })
}

logger.break = () => {
  logger()
}

logger.red = (message = '', options: LoggerOptions = {}) => logger(red(message), options)
logger.green = (message = '', options: LoggerOptions = {}) => logger(green(message), options)
logger.yellow = (message = '', options: LoggerOptions = {}) => logger(yellow(message), options)

logger.success = (message = '', options: LoggerOptions = {}) => logger(green('✓ ') + message, options)
logger.warn = (message = '', options: LoggerOptions = {}) => logger(yellow('⚠ ') + message, options)
logger.error = (message = '', options: LoggerOptions = {}) => {
  if (options.clearLine) replaceLine()
  logger(red('✗ ') + message, options)
}
