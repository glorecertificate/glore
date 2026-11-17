#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import { platform } from 'node:os'
import { setTimeout as sleep } from 'node:timers/promises'

import {
  PLAYWRIGHT_CONTAINER,
  PLAYWRIGHT_ENDPOINT,
  PLAYWRIGHT_IMAGE,
  PLAYWRIGHT_PORT,
  imageVersion,
} from './playwright-image.ts'

const READY_TIMEOUT = 180_000
const HOST_NETWORK = platform() === 'linux'

const docker = (...args: string[]) => execFileSync('docker', args, { stdio: ['ignore', 'ignore', 'inherit'] })

const isReady = async () => {
  try {
    const response = await fetch(`http://127.0.0.1:${PLAYWRIGHT_PORT}/`)
    return response.ok
  } catch {
    return false
  }
}

const waitUntilReady = async () => {
  const deadline = Date.now() + READY_TIMEOUT
  while (Date.now() < deadline) {
    if (await isReady()) return true
    await sleep(500)
  }
  return false
}

const start = () => {
  const network = HOST_NETWORK
    ? ['--network', 'host']
    : ['--publish', `127.0.0.1:${PLAYWRIGHT_PORT}:${PLAYWRIGHT_PORT}`]
  docker(
    'run',
    '--detach',
    '--rm',
    '--init',
    '--ipc',
    'host',
    '--name',
    PLAYWRIGHT_CONTAINER,
    '--user',
    'pwuser',
    '--workdir',
    '/home/pwuser',
    ...network,
    PLAYWRIGHT_IMAGE,
    'npx',
    '--yes',
    `playwright@${imageVersion(PLAYWRIGHT_IMAGE)}`,
    'run-server',
    '--port',
    String(PLAYWRIGHT_PORT),
    '--host',
    HOST_NETWORK ? '127.0.0.1' : '0.0.0.0'
  )
}

const run = (args: string[]) => {
  const env = {
    ...process.env,
    PW_TEST_CONNECT_WS_ENDPOINT: PLAYWRIGHT_ENDPOINT,
    ...(!HOST_NETWORK && { PW_TEST_CONNECT_EXPOSE_NETWORK: '<loopback>' }),
  }
  const { status } = spawnSync('pnpm', ['run', 'test:e2e', ...args], { env, stdio: 'inherit' })
  process.exit(status ?? 1)
}

const main = async () => {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'stop') return docker('rm', '--force', PLAYWRIGHT_CONTAINER)
  if (!(await isReady())) start()
  if (!(await waitUntilReady())) {
    console.error(`The Playwright server did not answer on port ${PLAYWRIGHT_PORT}.`)
    process.exit(1)
  }
  console.info(`Pinned browsers listen on ${PLAYWRIGHT_ENDPOINT}`)
  if (command === 'test') run(args)
}

await main()
