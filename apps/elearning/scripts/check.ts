import { execSync } from 'node:child_process'

const TSCONFIG = 'tsconfig.json'
const TSCONFIG_BUILD = 'tsconfig.build.json'

const tsconfig = process.env.NODE_ENV === 'production' ? TSCONFIG_BUILD : TSCONFIG

execSync(`./node_modules/.bin/tsc -p ${tsconfig} --noEmit`, { stdio: 'inherit' })
