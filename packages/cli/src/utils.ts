import { logger } from '@glore/utils/logger'

export const exitProcess = (message: string, { break: breakLine = true, code = 1 } = {}) => {
  if (code === 0) logger.green(message, { clearLine: false })
  if (code > 0) logger.red(message, { clearLine: false })
  if (breakLine) logger.break()
  process.exit(code)
}
