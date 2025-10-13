import { execSync } from 'node:child_process'

const TSCONFIG = 'tsconfig.json'
const TSCONFIG_BUILD = 'tsconfig.build.json'

execSync(`./node_modules/.bin/tsc -p ${process.env.NODE_ENV === 'production' ? TSCONFIG_BUILD : TSCONFIG} --noEmit`, {
  stdio: 'inherit',
})
