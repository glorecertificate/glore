#!/usr/bin/env tsx

import { execSync, type SpawnSyncReturns } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { type NestedKeyOf } from 'next-intl'

import type messages from '~/messages/en.json'

import { logger } from './logger'

type I18nIgnore = NestedKeyOf<typeof messages> | `${NestedKeyOf<typeof messages>}.*`

const DEFAULT_CHECK_ARGS = ['types', 'lint', 'knip', 'i18n', 'size'] as const
const I18N_OPTIONS = ['invalidKeys', 'missingKeys', 'unused'] as const
const I18N_IGNORES = [
  'Auth.*',
  'Certificates.*',
  'Components.*',
  'Email.*',
  'Intl.Countries.*',
  'Intl.Languages.*',
  'Metadata.*',
] satisfies I18nIgnore[]

const args = process.argv.slice(2)
const checks = args && args.length > 0 ? args : DEFAULT_CHECK_ARGS
const i18nCmd = `i18n-check --source en --locales ./messages --format next-intl --unused src --ignore ${I18N_IGNORES.join(' ')}`
const i18nUnusedCmd = `${i18nCmd} --only unused`

const check = async () => {
  let hasErrors = false

  for (const check of checks) {
    const isSingleArg = checks.length === 1

    switch (check) {
      case 'types':
        {
          const typesCmd = `tsc -p ${process.env.NODE_ENV === 'production' ? 'tsconfig.build.json' : 'tsconfig.json'} --noEmit`

          if (!isSingleArg) logger.inline('Checking validity of types...')
          execSync('pnpm run typegen', { stdio: 'ignore' })

          if (isSingleArg) {
            try {
              execSync(typesCmd, { stdio: 'inherit' })
            } catch {
              process.exit(1)
            }
          }

          try {
            execSync(typesCmd)
            logger.success('Type checks passed successfully', { clearLine: true })
          } catch (e) {
            const error = e as SpawnSyncReturns<Buffer>
            logger.error('Type checks failed with the following errors.', { clearLine: true })
            logger(error.stdout.toString())
            logger.red('Run `pnpm check types` to see a detailed report.')
            process.exit(1)
          }
        }
        break

      case 'lint': {
        const lintCmd = 'biome check'

        if (isSingleArg) {
          try {
            execSync(lintCmd, { stdio: 'inherit' })
          } catch {
            process.exit(1)
          }
        }

        try {
          logger.inline('Running lint and format checks...')
          execSync(lintCmd, { stdio: 'ignore' })
          logger.success('All files are properly linted and formatted', { clearLine: true })
        } catch {
          logger.error('Found linting issues. Run `pnpm check lint` to apply safe fixes and see a detailed report.', {
            clearLine: true,
          })
          hasErrors = true
        }
        break
      }

      case 'knip': {
        const knipCmd = 'knip'

        if (isSingleArg) {
          try {
            execSync(knipCmd, { stdio: 'inherit' })
          } catch {
            process.exit(1)
          }
        }

        try {
          logger.inline('Checking for unused files and dependencies...')
          execSync(knipCmd, { stdio: 'ignore' })
          logger.success('No unused files or dependencies found', { clearLine: true })
        } catch {
          logger.error('Found unused files or dependencies. Run `pnpm check knip` to see a detailed report.', {
            clearLine: true,
          })
        }
        break
      }

      case 'i18n':
        {
          const only = I18N_OPTIONS.map(only => (only === 'unused' ? only : `${only}Keys`)).join(' ')
          const i18nOnlyCmd = `${i18nCmd}${only ? ` --only ${only}` : ''}`

          if (isSingleArg) {
            try {
              execSync(i18nOnlyCmd, { stdio: 'inherit' })
              execSync(i18nUnusedCmd, { stdio: 'inherit' })
            } catch {
              process.exit(1)
            }
          }

          logger.inline('Checking translation files...')

          let hasWarnings = false

          try {
            execSync(i18nOnlyCmd, { stdio: 'ignore' })
          } catch {
            logger.error('Found issues in translation files. Run `pnpm check i18n` to see a detailed report.', {
              clearLine: true,
              newline: true,
            })
            hasErrors = true
            break
          }

          try {
            execSync(i18nUnusedCmd, { stdio: 'ignore' })
          } catch {
            logger.warn(
              'Found unused keys in translation files. Run `pnpm check i18n-unused` to see a detailed report.',
              { clearLine: true }
            )
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
              throw new Error('Build folder not found, run `pnpm build` before checking the size.')
            }
          } catch (e) {
            const error = e as Error
            logger.error(`Size check failed. ${error.message}`, { clearLine: !isSingleArg })
            break
          }

          try {
            execSync('size-limit', { stdio: isSingleArg ? 'inherit' : 'ignore' })
          } catch (error) {
            if (isSingleArg) throw error
            logger.error(
              `The build size exceeds the limit of ${sizeLimit!.limit}. Run \`pnpm check size\` to see a detailed report.`,
              { clearLine: true }
            )
            break
          }

          if (!isSingleArg) logger.success(`The build size is within ${sizeLimit!.limit}`, { clearLine: true })
        }
        break

      default:
        logger.red(`\nUnknown check: '${check}'`)
        process.exit(1)
    }
  }

  if (hasErrors) {
    process.exit(1)
  }
}

check().catch(() => process.exit(1))
