import { stdout } from 'node:process'

import packageJson from '../package.json'

const NODE_MODULES_BIN = '../node_modules/.bin'

export const cli = {
  name: Object.keys(packageJson.bin)[0],
  description: packageJson.description,
  bin: (cli: 'biome' | 'dotenv' | 'email' | 'i18n-check' | 'lt' | 'next' | 'size-limit' | 'supabase' | 'tsc') =>
    new URL(`${NODE_MODULES_BIN}/${cli}`, import.meta.url).pathname,
  logs: {
    clearLine: stdout.isTTY,
  },
} as const
