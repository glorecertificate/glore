import { execSync } from 'node:child_process'

import { Command } from 'commander'

import { cli } from '../config'

export const build = new Command('build').description('Build the project in a Next.js environment').action(() => {
  execSync(`${cli.bin('next')} build`, { stdio: 'inherit' })
})
