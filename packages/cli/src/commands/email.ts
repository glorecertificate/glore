import { execSync } from 'node:child_process'

import { Command } from 'commander'

import { cli } from '../config'

export const email = new Command('email')
  .description('Run the email worker locally')
  .option('-p, --port <number>', 'port to run the email worker on', process.env.PORT ?? '8001')
  .option('-d, --dir <path>', 'path to the email templates directory', './emails')
  .action(({ dir, port }) => {
    execSync(`${cli.bin('email')} dev --port ${port} --dir ${dir}`, { stdio: 'inherit' })
  })
