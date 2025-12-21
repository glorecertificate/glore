#!/usr/bin/env tsx

import { type SpawnSyncReturns, execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { logger } from '@glore/utils/logger'
import { Argument, Command, Option } from 'commander'

import { cli } from '../config'
import { exitProcess } from '../utils'

const CHECK_ARGS = ['i18n', 'i18n-unused', 'lint', 'size', 'types'] as const
const DEFAULT_CHECK_ARGS = ['types', 'lint', 'i18n', 'size'] as const

const I18N_OPTIONS = ['invalidKeys', 'missingKeys', 'unused'] as const
const DEFAULT_I18N_OPTIONS = ['invalidKeys', 'missingKeys'] as const

export const check = new Command('check')
  .description('Check the project against different validations')
  .addArgument(new Argument('[checks...]', 'checks to run').choices(CHECK_ARGS))
  .option('-m, --messages <path>', 'path to the translations directory', './messages')
  .addOption(new Option('-i, --i18n <checks...>', 'i18n checks to run').choices(I18N_OPTIONS))
  .option('--i18n-ignore <keys...>', 'i18n keys to ignore during checks')
  .option(
    '-t, --tsconfig <path>',
    'path to the tsconfig file',
    process.env.NODE_ENV === 'production' ? 'tsconfig.build.json' : 'tsconfig.json'
  )
  .option('-b, --build', 'build the project before running checks', false)
  .option('--typegen', 'generate types before running checks', false)
  .action(async (args, { build, i18n = DEFAULT_I18N_OPTIONS, i18nIgnore = [], messages, tsconfig, typegen }) => {
    const checks = args && args.length > 0 ? args : DEFAULT_CHECK_ARGS
    const i18nCmd = `${cli.bin('i18n-check')} --source en --locales ${messages} --ignore ${i18nIgnore.map(key => `"${key}"`).join(' ')} --format next-intl --unused src`
    const i18nUnusedCmd = `${i18nCmd} --only unused`

    for (const check of checks) {
      const isSingleArg = checks.length === 1

      switch (check) {
        case 'types':
          {
            const typesCmd = `${cli.bin('tsc')} -p ${tsconfig} --noEmit`

            if (typegen) {
              if (!isSingleArg) logger.inline('Generating application types...')
              execSync(`${cli.name} typegen`, { stdio: 'ignore' })
            }

            if (isSingleArg) {
              execSync(typesCmd, { stdio: 'inherit' })
              return
            }

            try {
              logger.inline('Checking validity of types...', { clearLine: typegen })
              execSync(typesCmd)
              logger.success('Type check passed successfully', cli.logs)
            } catch (e) {
              const error = e as SpawnSyncReturns<Buffer>
              logger.error('Type check failed with the following errors:', cli.logs)
              logger(error.stdout.toString(), cli.logs)
              exitProcess(`Run '${cli.name} check types' to see a detailed report.`)
            }
          }
          break
        case 'lint': {
          const lintCmd = `${cli.bin('biome')} check`

          if (isSingleArg) {
            execSync(lintCmd, { stdio: 'inherit' })
            return
          }

          try {
            logger.inline('Running lint and format checks...')
            execSync(lintCmd, { stdio: 'ignore' })
            logger.success('All files are properly linted and formatted', cli.logs)
          } catch (e) {
            const error = e as SpawnSyncReturns<Buffer>
            logger.error('Found linting issues:', cli.logs)
            logger(error.stdout.toString(), cli.logs)
            exitProcess(`Run '${cli.name} check lint' to apply safe fixes and see a detailed report.`)
          }
          break
        }
        case 'i18n':
          {
            const only = i18n.map(only => (only === 'unused' ? only : `${only}Keys`)).join(' ')
            const i18nOnlyCmd = `${i18nCmd}${only ? ` --only ${only}` : ''}`

            if (isSingleArg) {
              execSync(i18nOnlyCmd, { stdio: 'inherit' })
              execSync(i18nUnusedCmd, { stdio: 'inherit' })
              return
            }

            logger.inline('Checking translation files...')

            let hasWarnings = false

            try {
              execSync(i18nOnlyCmd, { stdio: 'ignore' })
            } catch (e) {
              const error = e as { stdout: Buffer }
              logger.error('Found issues in translation files', cli.logs)
              exitProcess(error.stdout.toString().replace(/!/g, ''), { break: false })
            }

            try {
              execSync(i18nUnusedCmd, { stdio: 'ignore' })
            } catch {
              logger.warn('Found unused keys in translation files', cli.logs)
              logger.yellow(`Run '${cli} check i18n-unused' to see a detailed report.`, cli.logs)
              hasWarnings = true
            }

            if (!hasWarnings) {
              logger.success('All translations are valid and in use', cli.logs)
            }
          }
          break
        case 'i18n-unused':
          {
            try {
              execSync(i18nUnusedCmd, { stdio: 'inherit' })
            } catch {
              process.exit(1)
            }
          }
          break
        case 'size':
          {
            let sizeLimit: {
              path: string
              limit: number
            }

            if (!isSingleArg) logger.inline('Running size check...')

            try {
              if (!existsSync(resolve(process.cwd(), 'node_modules/@size-limit/preset-app'))) {
                throw new Error('Missing preset, install @size-limit/preset-app to run the check.')
              }
              try {
                const pkg = await import(resolve(process.cwd(), 'package.json'))
                sizeLimit = pkg['size-limit']?.[0]
              } catch {
                throw new Error('Missing size-limit configuration in package.json.')
              }
              if (!(sizeLimit.path && sizeLimit.limit)) {
                throw new Error('Invalid size-limit configuration.')
              }
              if (!(build || existsSync(resolve(process.cwd(), sizeLimit.path)))) {
                throw new Error('Build directory not found, run the build command first or use the --build option.')
              }
            } catch (e) {
              const error = e as Error
              if (isSingleArg) throw error
              logger.error('Size check failed', cli.logs)
              exitProcess(error.message)
            }

            if (build) {
              if (!isSingleArg) logger.inline('Building the project...', { clearLine: true })

              try {
                execSync(`${cli.name} build`, { stdio: 'ignore' })
              } catch (e) {
                if (isSingleArg) throw e
                exitProcess('Build failed, cannot run size check.')
              }
            }

            try {
              execSync(`${cli.bin('size-limit')}`, { stdio: isSingleArg ? 'inherit' : 'ignore' })
            } catch (error) {
              if (isSingleArg) throw error
              logger.error(`The build size exceeds the limit of ${sizeLimit!.limit}`, cli.logs)
              exitProcess(`Run '${cli.name} check size' to see a detailed report.`)
            }

            if (!isSingleArg) logger.success(`The build size is within ${sizeLimit!.limit}`, cli.logs)
          }
          break
        default:
          exitProcess(`Unknown check: '${check}'`)
      }
    }
  })
