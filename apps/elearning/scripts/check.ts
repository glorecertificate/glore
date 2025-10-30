import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { stdout } from 'node:process'

import { logger } from '@glore/utils/logger'

import i18n from '../config/i18n.json'
import packageJson from '../package.json'

const TSCONFIG = 'tsconfig.json'
const TSCONFIG_BUILD = 'tsconfig.build.json'

const tsconfig = process.env.NODE_ENV === 'production' ? TSCONFIG_BUILD : TSCONFIG
const sizeLimit = packageJson['size-limit'][0]

const logOptions = {
  replace: stdout.isTTY,
}

logger.inline('Running type checks...')
execSync(`./node_modules/.bin/tsc -p ${tsconfig} --noEmit`, { stdio: 'inherit' })
logger.success('Type checks passed successfully', logOptions)

logger.inline('Checking bundle size...')
if (!existsSync(sizeLimit.path)) {
  logger.error('Missing bundle, build the project to run size checks', logOptions)
  process.exit(1)
}
try {
  execSync('./node_modules/.bin/size-limit', { stdio: 'ignore' })
} catch {
  logger.error(`The bundle size exceeds the limit of ${sizeLimit.limit}`, logOptions)
  logger.red('Run size-limit to see a detailed report.', logOptions)
  process.exit(1)
}
logger.success(`The bundle size is within ${sizeLimit.limit}`, logOptions)

logger.inline('Checking translation files...')
try {
  execSync(`./node_modules/.bin/i18n-check -l ./config/translations -s ${i18n.defaultLocale} -f next-intl -u src`)
} catch (e) {
  const error = e as { stdout: Buffer }
  logger.error('Found issues in translation files\n', logOptions)
  logger.red(error.stdout.toString().replace(/!/g, '').split('\n').slice(4).join('\n'), logOptions)
  process.exit(1)
}
logger.success('All translation files are valid and in use', logOptions)
