#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

import { logger } from '@glore/utils/logger'
import { Argument, Command, Option } from 'commander'

import { cli } from '../config'

const ARGS = ['i18n-unused', 'i18n', 'lint', 'size', 'types'] as const
const I18N_OPTIONS = ['invalid', 'missing', 'unused'] as const

export const check = new Command('check')
  .description('Check the project against different validations')
  .addArgument(new Argument('[checks...]', 'checks to run').choices(ARGS))
  .addOption(new Option('-i, --i18n <checks...>', 'i18n checks to run').choices(I18N_OPTIONS))
  .option('-g, --i18n-ignore <keys...>', 'i18n keys to ignore during checks')
  .option('-m, --messages <path>', 'path to the translations directory', './messages')
  .option('-s, --size-limit <limit>', 'limit for bundle size checks express in kilobytes', '200')
  .option(
    '-t, --tsconfig <path>',
    'path to the tsconfig file',
    process.env.NODE_ENV === 'production' ? 'tsconfig.build.json' : 'tsconfig.json'
  )
  .action((args, { i18n = ['invalidKeys', 'missingKeys'], i18nIgnore = [], messages, sizeLimit, tsconfig }) => {
    const checks = args && args.length > 0 ? args : ARGS

    if (checks.includes('types')) {
      try {
        logger.inline('Checking validity of types...')
        execSync(`${cli.bin('tsc')} -p ${tsconfig} --noEmit`, { stdio: 'ignore' })
        logger.success('Type check passed successfully', cli.logOptions)
      } catch {
        logger.error('Type check failed', cli.logOptions)
        logger.red('Run tsc to see a detailed report.', cli.logOptions)
        process.exit(1)
      }
    }

    if (checks.includes('lint')) {
      try {
        logger.inline('Running lint and format checks...')
        execSync(`${cli.bin('biome')} check`, { stdio: 'ignore' })
        logger.success('All files are properly linted and formatted', cli.logOptions)
      } catch {
        logger.error('Found linting issues', cli.logOptions)
        logger("Run 'biome check --fix' to apply safe fixes and see a detailed report.", cli.logOptions)
        process.exit(1)
      }
    }

    const i18nCommand = `${cli.bin('i18n-check')} -s en -l ${messages} -i ${i18nIgnore.map(k => `"${k}"`).join(' ')} -f next-intl -u src`

    if (checks.includes('size')) {
      logger.inline('Checking bundle size...')
      if (!existsSync('./.next/bundle')) {
        logger.error('Missing bundle, build the project to run size checks', cli.logOptions)
        process.exit(1)
      }
      try {
        execSync(`${cli.bin('size-limit')} ./next/bundle --limit ${sizeLimit} kB`, { stdio: 'ignore' })
      } catch {
        logger.error(`The bundle size exceeds the limit of ${sizeLimit} kB`, cli.logOptions)
        logger.red('Run size-limit to see a detailed report.', cli.logOptions)
        process.exit(1)
      }
      logger.success(`The bundle size is within ${sizeLimit} kB`, cli.logOptions)
    }

    if (checks.includes('i18n')) {
      logger.inline('Checking translation files...')
      let hasWarnings = false

      try {
        execSync(`${i18nCommand} -o ${i18n.map(only => (only === 'unused' ? only : `${only}Keys`)).join(' ')}`)
      } catch (e) {
        const error = e as { stdout: Buffer }
        logger.error('Found issues in translation files', cli.logOptions)
        if (error.stdout) logger.red(error.stdout.toString().replace(/!/g, ''), cli.logOptions)
        process.exit(1)
      }

      try {
        execSync(`${i18nCommand} -o unused`)
      } catch {
        logger.warn('Found unused keys in translation files', cli.logOptions)
        logger.yellow("Run 'pnpm check i18n-unused' to see a detailed report.", cli.logOptions)
        hasWarnings = true
      }

      if (!hasWarnings) {
        logger.success('All translations are valid and in use', cli.logOptions)
      }
    }

    if (checks.includes('i18n-unused')) {
      try {
        execSync(`${i18nCommand} -o unused`, { stdio: 'inherit' })
      } catch {
        process.exit(1)
      }
    }
  })
