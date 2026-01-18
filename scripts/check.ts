#!/usr/bin/env tsx

import { execSync, type SpawnSyncReturns } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { type NestedKeyOf } from 'next-intl'

import type messages from '@config/translations/en'
import { logger } from './logger'

type I18nIgnore = NestedKeyOf<typeof messages> | `${NestedKeyOf<typeof messages>}.*`

const DEFAULT_CHECK_ARGS = ['types', 'lint', 'i18n', 'size'] as const
const I18N_OPTIONS = ['invalidKeys', 'missingKeys', 'unused'] as const
const I18N_IGNORES = [
  'Auth.*',
  'Certificates.*',
  'Components.*',
  'Email.*',
  'Locale.Countries.*',
  'Locale.Languages.*',
  'Metadata.pwaDescription',
] satisfies I18nIgnore[]

const args = process.argv.slice(2)
const checks = args && args.length > 0 ? args : DEFAULT_CHECK_ARGS
const i18nCmd = `i18n-check --source en --locales ./config/translations --format next-intl --unused src --ignore ${I18N_IGNORES.join(' ')}`
const i18nUnusedCmd = `${i18nCmd} --only unused`

const check = async () => {
  for (const check of checks) {
    const isSingleArg = checks.length === 1

    switch (check) {
      case 'types':
        {
          const typesCmd = `tsc -p ${process.env.NODE_ENV === 'production' ? 'tsconfig.build.json' : 'tsconfig.json'} --noEmit`

          if (!isSingleArg) logger.inline('Generating application types...')
          execSync('pnpm run typegen', { stdio: 'ignore' })

          if (isSingleArg) {
            execSync(typesCmd, { stdio: 'inherit' })
            process.exit(0)
          }

          try {
            logger.inline('Checking validity of types...', { clearLine: true })
            execSync(typesCmd)
            logger.success('Type checks passed successfully', { clearLine: true })
          } catch (e) {
            const error = e as SpawnSyncReturns<Buffer>
            logger.error('Type checks failed with the following errors.', { clearLine: true })
            logger(error.stdout.toString())
            logger.error(`Run 'pnpm check types' to see a detailed report.`)
            process.exit(1)
          }
        }
        break

      case 'lint': {
        const lintCmd = 'biome check'

        if (isSingleArg) {
          execSync(lintCmd, { stdio: 'inherit' })
          process.exit(0)
        }

        try {
          logger.inline('Running lint and format checks...')
          execSync(lintCmd, { stdio: 'ignore' })
          logger.success('All files are properly linted and formatted', { clearLine: true })
        } catch {
          logger.error('Found linting issues', { clearLine: true })
          logger.red(`Run 'pnpm check lint' to apply safe fixes and see a detailed report.\n`)
          process.exit(1)
        }
        break
      }

      case 'i18n':
        {
          const only = I18N_OPTIONS.map(only => (only === 'unused' ? only : `${only}Keys`)).join(' ')
          const i18nOnlyCmd = `${i18nCmd}${only ? ` --only ${only}` : ''}`

          if (isSingleArg) {
            execSync(i18nOnlyCmd, { stdio: 'inherit' })
            execSync(i18nUnusedCmd, { stdio: 'inherit' })
            process.exit(0)
          }

          logger.inline('Checking translation files...')

          let hasWarnings = false

          try {
            execSync(i18nOnlyCmd, { stdio: 'ignore' })
          } catch {
            logger.error('Found issues in translation files', { clearLine: true, newline: true })
            logger.red(`Run 'pnpm check i18n' to see a detailed report.\n`)
            process.exit(1)
          }

          try {
            execSync(i18nUnusedCmd, { stdio: 'ignore' })
          } catch {
            logger.warn('Found unused keys in translation files', { clearLine: true })
            logger.yellow(`Run 'pnpm check i18n-unused' to see a detailed report.`)
            hasWarnings = true
          }

          if (!hasWarnings) {
            logger.success('All translations are valid and in use', { clearLine: true })
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
            if (!existsSync(resolve(process.cwd(), sizeLimit.path))) {
              throw new Error("Build folder not found, run 'pnpm build' to proceed.")
            }
          } catch (e) {
            const error = e as Error
            if (isSingleArg) throw error
            logger.error('Size check failed', { clearLine: true })
            logger.red(`${error.message}\n`)
            process.exit(1)
          }

          if (!isSingleArg) logger.inline('Building the project...', { clearLine: true })

          try {
            execSync('size-limit', { stdio: isSingleArg ? 'inherit' : 'ignore' })
          } catch (error) {
            if (isSingleArg) throw error
            logger.error(`The build size exceeds the limit of ${sizeLimit!.limit}`, { clearLine: true })
            logger.error(`Run 'pnpm check size' to see a detailed report.\n`)
            process.exit(1)
          }

          if (!isSingleArg) logger.success(`The build size is within ${sizeLimit!.limit}`, { clearLine: true })
        }
        break

      default:
        logger.error(`Unknown check: '${check}'`, { clearLine: true })
        process.exit(1)
    }
  }
}

check().catch(() => process.exit(1))
