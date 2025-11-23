import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { stdout } from 'node:process'

import { logger } from '@glore/utils/logger'

import i18n from '../config/i18n.json'
import packageJson from '../package.json'

const CHECKS = ['types', 'lint', 'size', 'i18n', 'i18n-unused'] as const

const I18N_PATH = './config/translations'
const I18N_COMMANDS = ['invalidKeys', 'missingKeys']
const I18N_UNUSED_COMMAND = 'unused'
const I18N_IGNORED_KEYS = [
  'Auth.*',
  'Components.RichTextEditor.*',
  'Countries.*',
  'Email.*',
  'Errors.*',
  'Icons.categories.*',
  'Languages.*',
  'Metadata.*',
]

const logOptions = { replace: stdout.isTTY }
const tsconfig = process.env.NODE_ENV === 'production' ? 'tsconfig.build.json' : 'tsconfig.json'
const sizeLimit = packageJson['size-limit'][0]
const i18nBaseCommand = `./node_modules/.bin/i18n-check -s ${i18n.defaultLocale} -l ${I18N_PATH} -i ${I18N_IGNORED_KEYS.map(k => `"${k}"`).join(' ')} -f next-intl -u src`

const args = process.argv.slice(2)
const included = (check: (typeof CHECKS)[number]) => args.length === 0 || args.includes(check)

if (included('types')) {
  logger.inline('Checking validity of types...')
  execSync(`./node_modules/.bin/tsc -p ${tsconfig} --noEmit`, { stdio: 'inherit' })
  logger.success('Type check passed successfully', logOptions)
}

if (included('lint')) {
  try {
    logger.inline('Running lint and format checks...')
    execSync('./node_modules/.bin/biome check', { stdio: 'ignore' })
    logger.success('All files are properly linted and formatted', logOptions)
  } catch {
    logger.error('Found linting issues', logOptions)
    logger("Run 'biome check --fix' to apply safe fixes and see a detailed report.", logOptions)
    process.exit(1)
  }
}

if (included('size')) {
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
}

if (included('i18n')) {
  logger.inline('Checking translation files...')
  let hasWarnings = false

  try {
    execSync(`${i18nBaseCommand} -o ${I18N_COMMANDS.join(' ')}`)
  } catch (e) {
    const error = e as { stdout: Buffer }
    logger.error('Found issues in translation files\n', logOptions)
    if (error.stdout) logger.red(error.stdout.toString().replace(/!/g, '').split('\n').slice(4).join('\n'), logOptions)
    process.exit(1)
  }

  try {
    execSync(`${i18nBaseCommand} -o ${I18N_UNUSED_COMMAND}`)
  } catch {
    logger.warn('Found unused keys in translation files', logOptions)
    logger.yellow("Run 'pnpm check i18n-unused' to see a detailed report.", logOptions)
    hasWarnings = true
  }

  if (!hasWarnings) {
    logger.success('All translations are valid and in use', logOptions)
  }
}

if (args.includes('i18n-unused')) {
  try {
    execSync(`${i18nBaseCommand} -o ${I18N_UNUSED_COMMAND}`, { stdio: 'inherit' })
  } catch {
    process.exit(1)
  }
}
