import { stdout } from 'node:process'

import packageJson from '../package.json'

const NODE_MODULES_BIN = '../node_modules/.bin'

export const cli = {
  name: Object.keys(packageJson.bin)[0],
  description: packageJson.description,
  bin: (cli: string) => new URL(`${NODE_MODULES_BIN}/${cli}`, import.meta.url).pathname,
  logOptions: {
    replace: stdout.isTTY,
  },
} as const
