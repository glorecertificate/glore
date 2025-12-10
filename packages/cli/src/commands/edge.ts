import { execSync } from 'node:child_process'

import { Command } from 'commander'

import { cli } from '../config'

export const edge = new Command('edge')
  .description('Run the Supabase edge functions locally')
  .option('-p, --port <number>', 'port to run the edge functions on', process.env.PORT ?? '8000')
  .option('-P, --path <path>', 'path to the Supabase edge functions', './supabase/functions')
  .action(({ path, port }) => {
    execSync(`${cli.bin('dotenv')} -e ${path}/.env -- ${cli.bin('lt')} --port ${port}`, { stdio: 'inherit' })
  })
