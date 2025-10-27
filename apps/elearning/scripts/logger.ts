import { stdout } from 'node:process'

import chalk from 'chalk'

interface MessageOptions {
  /** @default false */
  replace?: boolean
  /** @default 'info' */
  type?: Exclude<keyof Console, 'Console'>
}

export const logger = (message: string, { replace = false, type = 'info' }: MessageOptions = {}) => {
  // biome-ignore lint: no-console
  const logger = console[type].length > 0 ? console[type] : console.info

  if (replace) {
    stdout.moveCursor(0, -1)
    stdout.clearLine(1)
    stdout.cursorTo(0)
  }

  logger(message)
}

logger.success = (message: string, { replace }: MessageOptions = {}) => {
  logger(chalk.green(`✓ ${message}`), { replace })
}

logger.error = (message: string, { replace }: MessageOptions = {}) => {
  logger(chalk.red(`✗ ${message}`), { replace, type: 'error' })
}
