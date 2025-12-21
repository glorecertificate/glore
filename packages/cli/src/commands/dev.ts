import { execSync } from 'node:child_process'

import { Command } from 'commander'

import { cli } from '../config'

export const dev = new Command('dev')
  .description('Run the project in a Next.js development environment')
  .option('-p, --port <number>', 'port to run the email worker on', process.env.PORT ?? '8000')
  .action(({ port }) => {
    execSync(`${cli.bin('next')} dev --port ${port}`, { stdio: 'inherit' })
  })
