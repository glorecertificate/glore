import { execSync } from 'node:child_process'

import { Command } from 'commander'

import { cli } from '../config'

export const dev = new Command('dev').description('Run the project in a Next.js development environment').action(() => {
  execSync(`${cli.bin('next')} dev`, { stdio: 'inherit' })
})
