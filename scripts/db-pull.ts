#!/usr/bin/env tsx

import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'

import { loadEnvConfig } from '@next/env'

const CONTAINER = 'glore-postgres'
const DEFAULT_TARGET = 'postgresql://glore:glore@localhost:5433/glore'
const TARGET_ENV = '.env.development.local'

const maskUrl = (url: string) => {
  try {
    const u = new URL(url)
    if (u.password) u.password = '****'
    u.search = ''
    return u.toString()
  } catch {
    return url
  }
}

const confirm = async (prompt: string) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(prompt)
  rl.close()
  return /^y(es)?$/iu.test(answer.trim())
}

const file = process.argv[2] ?? '.env'

if (!existsSync(file)) {
  console.error(`Error: file "${file}" not found.`)
  process.exit(1)
}

const pull = async () => {
  const env = await loadEnvConfig('.').loadedEnvFiles.find(({ path }) => path === file)?.env
  const targetEnv = await loadEnvConfig('.', true, undefined, true).loadedEnvFiles.find(
    ({ path }) => path === TARGET_ENV
  )?.env

  if (!env) {
    console.error(`invalid file "${file}".`)
    process.exit(1)
  }
  if (!env.DATABASE_URL) {
    console.error(`Error: DATABASE_URL missing in "${file}".`)
    process.exit(1)
  }
  if (!targetEnv) {
    console.error(`Error: target env file "${TARGET_ENV}" not found.`)
    process.exit(1)
  }

  try {
    execSync(`docker exec ${CONTAINER} pg_isready -U glore -d glore`, { stdio: 'pipe' })
  } catch {
    console.error(`Error: local Postgres container "${CONTAINER}" is not running. Run \`pnpm run db:up\` first.`)
    process.exit(1)
  }

  console.info(`Source (${file}): ${maskUrl(env.DATABASE_URL)}`)
  console.info(`Target (${TARGET_ENV}): ${maskUrl(targetEnv.DATABASE_URL ?? DEFAULT_TARGET)}\n`)
  console.info('This will OVERWRITE the target database with the source data.')
  console.info('Existing tables, rows, and types in the target will be dropped.\n')

  const ok = await confirm('Continue? [y/N] ')
  if (!ok) process.exit(0)

  const cmd = `docker exec ${CONTAINER} pg_dump --clean --if-exists --no-owner --no-acl '${env.DATABASE_URL}' | docker exec -i ${CONTAINER} psql -v ON_ERROR_STOP=1 -U glore -d glore`

  spawn('sh', ['-c', cmd], { stdio: 'ignore' }).on('exit', code => {
    if (code === 0) console.info('Database pulled successfully.')
    process.exit(code ?? 0)
  })
}

void pull()
